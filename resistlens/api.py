"""Same-origin API and React static host. Single-process, ephemeral synthetic sessions."""
import base64
import binascii
import csv
import hashlib
import io
import json
import secrets
import time
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from threading import RLock, Lock
from zipfile import ZipFile, ZIP_DEFLATED
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import Field
from .models import StrictModel, ClinicalEvent, Case, readiness
from .fixtures import demo_cases, DEMO_NOW, make_document, render_document
from .engine import evaluate, case_state, RULE_VERSION
from .extraction import DemoAdapter, TextAdapter, OpenAIAdapter, ExtractionError
from .benchmark import ROOT, load_manifest, run_samples, summarize
from .evaluation import run_evaluation
from .risk_fixtures import SCENARIOS, demo_profile
from .risk_models import PriorCultureRecord
from .risk_engine import calculate_drug_risk
from .ledger import MockLedger

app = FastAPI(title='ResistLens synthetic API', docs_url=None, redoc_url=None)
SESSIONS = {}
REGISTRY_LOCK = RLock()
TTL = 3600
MAX_BODY = 12 * 1024 * 1024

class Session:
    def __init__(self):
        self.lock = Lock()
        self.touched = time.monotonic()
        self.cases = demo_cases()
        self.offset = 36
        self.audit = []
        self.images = {}
        self.pending = None
        self.key = None
        self.model = None
        self.transfers = {}
        self.benchmark_results = []
        self.benchmark_model = None
    @property
    def at(self):
        return DEMO_NOW + timedelta(hours=self.offset-36)

@app.middleware('http')
async def bounds(request, call_next):
    if request.url.path.startswith('/api'):
        if request.method in ('POST','PUT','PATCH'):
            size = 0
            chunks = []
            async for chunk in request.stream():
                size += len(chunk)
                if size > MAX_BODY:
                    return JSONResponse({'detail':'Request exceeds 12 MB.'},status_code=413)
                chunks.append(chunk)
            request._body = b''.join(chunks)
        response = await call_next(request)
        response.headers['Cache-Control'] = 'no-store'
    else:
        response = await call_next(request)
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Referrer-Policy'] = 'same-origin'
    return response

@app.exception_handler(RequestValidationError)
async def invalid_request(request, exc):
    # Never echo request bodies: connection forms contain credentials.
    return JSONResponse({'detail':'Invalid request. Check required fields and input limits.'},status_code=422)

@app.exception_handler(ValueError)
async def invalid_value(request, exc):
    return JSONResponse({'detail':'Invalid data. Check schema, source evidence and timezone-aware dates.'},status_code=422)

def session(request: Request):
    token = request.headers.get('Authorization','').removeprefix('Bearer ')
    with REGISTRY_LOCK:
        current = SESSIONS.get(token)
        if current is None or time.monotonic()-current.touched > TTL:
            SESSIONS.pop(token,None)
            raise HTTPException(401,'Session expired. Reload to begin a fresh synthetic session.')
        current.touched = time.monotonic()
    with current.lock:
        yield current

@app.get('/api/health')
def health():
    return {'status':'ok'}

@app.post('/api/session')
def create_session():
    with REGISTRY_LOCK:
        for token in list(SESSIONS):
            if time.monotonic()-SESSIONS[token].touched > TTL:
                del SESSIONS[token]
        if len(SESSIONS) >= 100:
            raise HTTPException(503,'Demo session capacity reached. Try again later.')
        token = secrets.token_urlsafe(32)
        SESSIONS[token] = Session()
    return {'token':token}

@app.delete('/api/session')
def end_session(request: Request, s=Depends(session)):
    token = request.headers.get('Authorization','').removeprefix('Bearer ')
    with REGISTRY_LOCK:
        SESSIONS.pop(token,None)
    s.key = None
    return {'ok':True}

def record(s, action, **detail):
    s.audit.append({'recorded_at_utc':datetime.now(timezone.utc).isoformat(),'action':action,**detail})

def state(s):
    rows=[]
    for case in s.cases:
        fs=evaluate(case,s.at)
        rows.append({**case.model_dump(mode='json'),'state':case_state(fs),
                     'findings':[f.model_dump(mode='json') for f in fs],
                     'readiness':{d.document_id:readiness(d) for d in case.documents}})
    return {'cases':rows,'offset':s.offset,'as_of':s.at.isoformat(),'audit':s.audit,
            'connection':{'configured':bool(s.key and s.model),'model':s.model},'rule_version':RULE_VERSION}

@app.get('/api/state')
def get_state(s=Depends(session)):
    return state(s)

class Clock(StrictModel):
    offset: int = Field(ge=0,le=48)

@app.post('/api/clock')
def clock(body: Clock,s=Depends(session)):
    s.offset=body.offset
    return state(s)

class Connection(StrictModel):
    api_key: str = Field(min_length=1,max_length=1024)
    model: str = Field(min_length=1,max_length=200)

@app.post('/api/connection')
def connect(body: Connection,s=Depends(session)):
    if not body.api_key.strip() or not body.model.strip():
        raise HTTPException(422,'Both fields are required.')
    s.key=body.api_key.strip(); s.model=body.model.strip()
    return {'configured':True,'model':s.model}

@app.delete('/api/connection')
def forget(s=Depends(session)):
    s.key=s.model=None
    return {'configured':False,'model':None}

def adapter(s):
    if not s.key or not s.model:
        raise HTTPException(400,'Save an AI connection for this session first.')
    return OpenAIAdapter(api_key=s.key,model=s.model)

@app.get('/api/samples')
def samples():
    return [{'id':d.event.event_id,'title':d.title,'text':d.text} for c in demo_cases() for d in c.documents]

@app.get('/api/samples/{eid}/image')
def sample_image(eid: str):
    d=next((d for c in demo_cases() for d in c.documents if d.event.event_id==eid),None)
    if not d: raise HTTPException(404,'Sample not found.')
    return Response(render_document(d),media_type='image/png')

class Extract(StrictModel):
    mode: str
    text: str = ''
    sample_id: str | None = None
    image_base64: str | None = None
    consent: bool = False

@app.post('/api/extract')
def extract(body: Extract,s=Depends(session)):
    s.pending=None
    if body.mode not in ('replay','text','live'): raise HTTPException(400,'Unknown extraction mode.')
    raw=None
    if body.mode != 'text':
        if body.image_base64:
            try: raw=base64.b64decode(body.image_base64,validate=True)
            except (ValueError,binascii.Error): raise HTTPException(400,'Invalid image encoding.')
        else:
            d=next((d for c in demo_cases() for d in c.documents if d.event.event_id==body.sample_id),None)
            if not d: raise HTTPException(400,'Select a synthetic sample or image.')
            raw=render_document(d)
    if body.mode=='live' and not body.consent: raise HTTPException(400,'Synthetic-image transmission consent required.')
    try:
        doc=TextAdapter().extract(body.text) if body.mode=='text' else (adapter(s) if body.mode=='live' else DemoAdapter()).extract(raw)
    except ExtractionError as exc:
        raise HTTPException(422,str(exc)) from None
    attempt=secrets.token_urlsafe(16)
    s.pending=(attempt,doc,raw)
    record(s,'Extraction completed',origin=doc.origin)
    return {'attempt':attempt,'document':doc.model_dump(mode='json')}

class Import(StrictModel):
    attempt: str
    event: ClinicalEvent
    verified: bool
    replace: bool = False

@app.post('/api/import')
def import_document(body: Import,s=Depends(session)):
    if not s.pending or body.attempt != s.pending[0]: raise HTTPException(409,'Extract this source again before importing.')
    if not body.verified: raise HTTPException(400,'Source verification required.')
    _,doc,raw=s.pending
    candidate=doc.model_copy(deep=True);candidate.event=body.event;candidate.verified=True
    quality=readiness(candidate)
    if not quality['eligible']: raise HTTPException(422,'; '.join(quality['problems']))
    target=next((c for c in s.cases if c.patient_id==body.event.patient_id),None)
    if target and target.encounter_id != body.event.encounter_id: raise HTTPException(409,'Patient already has a different encounter; encounters are never merged.')
    old=[d for d in target.documents if d.event.event_id==body.event.event_id] if target else []
    if old and not body.replace: raise HTTPException(409,'Event already exists. Select replacement explicitly.')
    if len(s.images) >= 30 and raw and candidate.sha256 not in s.images: raise HTTPException(413,'Session image limit reached. Export and reset.')
    if target is None:
        if len(s.cases)>=50: raise HTTPException(413,'Session case limit reached.')
        target=Case(patient_id=body.event.patient_id,encounter_id=body.event.encounter_id,label='Imported synthetic case',unit='Imported',story='Source-verified synthetic import.',documents=[])
        s.cases.append(target)
    if len(target.documents)>=100 and not old: raise HTTPException(413,'Case document limit reached.')
    target.documents=[d for d in target.documents if d.event.event_id!=body.event.event_id]+[candidate]
    if raw:s.images[candidate.sha256]=raw
    record(s,'Source verified and imported',before=[d.model_dump(mode='json') for d in old],after=candidate.model_dump(mode='json'))
    s.pending=None
    return state(s)

class Review(StrictModel):
    patient_id: str
    order_id: str
    report_id: str
    reviewer: str = Field(min_length=1,max_length=80)
    note: str = Field(min_length=1,max_length=1500)
    confirmed: bool

@app.post('/api/review')
def review(body: Review,s=Depends(session)):
    case=next((c for c in s.cases if c.patient_id==body.patient_id),None)
    if not case: raise HTTPException(404,'Case not found.')
    if not body.confirmed or not body.reviewer.strip() or not body.note.strip():raise HTTPException(400,'Reviewer, note and source confirmation required.')
    if not any(f.state=='Needs review' and f.report_id==body.report_id and f.order_id==body.order_id for f in evaluate(case,s.at)):
        raise HTTPException(409,'This pair is no longer open at the selected time.')
    if len(case.documents)>=100: raise HTTPException(413,'Case document limit reached.')
    doc=make_document(case.patient_id,case.encounter_id,'review','REV-'+secrets.token_hex(8),s.at.isoformat(),reviewed_report_id=body.report_id,reviewed_order_id=body.order_id,reviewer=body.reviewer.strip(),review_note=body.note.strip())
    doc.origin='human review';case.documents.append(doc)
    record(s,'Review recorded',patient_id=case.patient_id)
    return state(s)

@app.get('/api/source/{digest}')
def source(digest: str,s=Depends(session)):
    raw=s.images.get(digest)
    if not raw:raise HTTPException(404,'Source image not retained in this session.')
    return Response(raw,media_type='image/png' if raw.startswith(b'\x89PNG') else 'image/jpeg')

@app.get('/api/evaluation')
def evaluation():return run_evaluation()

@app.get('/api/benchmark')
def manifest():return load_manifest()

@app.get('/api/benchmark/{sid}/image')
def benchmark_image(sid: str):
    row=next((r for r in load_manifest() if r['sample_id']==sid),None)
    if not row:raise HTTPException(404,'Image not found.')
    return FileResponse(ROOT/row['image'],media_type='image/png')

class Benchmark(StrictModel):
    restart: bool = True
    ids: list[str] = Field(min_length=1,max_length=24)
    consent: bool

@app.post('/api/benchmark/run')
def benchmark_run(body: Benchmark,s=Depends(session)):
    if not body.consent:raise HTTPException(400,'Transmission and cost consent required.')
    rows=[r for r in load_manifest() if r['sample_id'] in body.ids]
    if len(rows)!=len(body.ids) or len({r['split'] for r in rows})!=1:raise HTTPException(400,'Select unique valid images from one split.')
    live = adapter(s)
    if body.restart:
        s.benchmark_results = []
        s.benchmark_model = live.model
    prior = s.benchmark_results
    if prior and (s.benchmark_model != live.model or prior[0]['split'] != rows[0]['split']):
        raise HTTPException(409,'Restart benchmark after changing model or split.')
    if len(prior)+len(rows)>24 or {r['sample_id'] for r in prior}.intersection(body.ids):
        raise HTTPException(409,'Restart benchmark before repeating images or exceeding 24 images.')
    result = run_samples(rows,live)
    s.benchmark_results.extend(result['results'])
    return summarize(s.benchmark_results,live.model)

@app.get('/api/guide/{step}')
def guide(step: int):
    if step not in range(4):raise HTTPException(400,'Invalid guide step.')
    case=demo_cases()[0]
    at=DEMO_NOW.replace(hour=9 if step==0 else 10 if step==1 else 11)
    if step>=2:
        case.documents.append(make_document(case.patient_id,case.encounter_id,'review','GUIDED-REVIEW',at.isoformat(),reviewed_report_id='DEMO-101-R1',reviewed_order_id='DEMO-101-O1',reviewer='Simulated reviewer',review_note='Simulated source-linked review.'))
    return {'findings':[f.model_dump(mode='json') for f in evaluate(case,at)],'documents':[d.model_dump(mode='json') for d in case.documents if d.event.occurred_at<=at]}

class Risk(StrictModel):
    patient_id: str
    scenario: str
    lookup: bool = False

@app.post('/api/risk')
def risk(body: Risk,s=Depends(session)):
    if body.scenario not in SCENARIOS:raise HTTPException(400,'Unknown scenario.')
    if not any(c.patient_id==body.patient_id for c in s.cases):raise HTTPException(404,'Case not found.')
    p=demo_profile(body.patient_id,body.scenario)
    result=None
    if body.scenario=='Transfer records unavailable':
        if body.lookup:
            c=PriorCultureRecord(record_id='SYN-TRANSFER-CULTURE',organism=p.organism,specimen='Synthetic sample',category='routine',observed_at=DEMO_NOW-timedelta(days=10),susceptibility={'Demo drug A':'R'},source_quote='Fictional hospital B: Demo drug A = R.')
            ledger=MockLedger();ledger.register('fictional-transfer-token','Fictional hospital B',c.model_dump(mode='json'),{'Fictional hospital A'})
            result=ledger.lookup('fictional-transfer-token','Fictional hospital A')
            if result['state']=='verified':s.transfers[body.patient_id]=result
        result=s.transfers.get(body.patient_id)
        if result:
            p.cultures.append(PriorCultureRecord.model_validate(result['payload']));p.transfer_unavailable=False
    return {'prediction':calculate_drug_risk(p,'Demo drug A','Demo class A',s.at).model_dump(mode='json'),'lookup':result}

@app.get('/api/export/{kind}')
def export(kind: str,s=Depends(session)):
    bundle={'as_of':s.at.isoformat(),'rule_version':RULE_VERSION,'cases':[c.model_dump(mode='json') for c in s.cases],'audit':s.audit}
    if kind=='session':return JSONResponse(bundle,headers={'Content-Disposition':'attachment; filename="resistlens-session.json"'})
    if kind=='queue':
        out=io.StringIO();writer=csv.writer(out);writer.writerow(['Patient','Scenario','Unit','State'])
        for c in s.cases:writer.writerow([c.patient_id,c.label,c.unit,case_state(evaluate(c,s.at))])
        return Response(out.getvalue(),media_type='text/csv',headers={'Content-Disposition':'attachment; filename="resistlens-queue.csv"'})
    if kind not in ('evidence','dataset','samples'):raise HTTPException(404,'Unknown export.')
    out=io.BytesIO()
    with ZipFile(out,'w',ZIP_DEFLATED) as z:
        if kind=='evidence':
            z.writestr('session.json',json.dumps(bundle,indent=2))
            for digest,raw in s.images.items():z.writestr('sources/'+digest+('.png' if raw.startswith(b'\x89PNG') else '.jpg'),raw)
        elif kind=='dataset':
            for f in ['manifest.json','DATASET_CARD.md']:z.write(ROOT/f,f)
            for row in load_manifest():z.write(ROOT/row['image'],row['image'])
        else:
            for c in demo_cases():
                for d in c.documents:
                    z.writestr(d.event.event_id+'.png',render_document(d));z.writestr(d.event.event_id+'.txt',d.text)
    return Response(out.getvalue(),media_type='application/zip',headers={'Content-Disposition':f'attachment; filename="resistlens-{kind}.zip"'})

DIST=Path(__file__).resolve().parents[1]/'web'/'dist'
if DIST.exists():
    app.mount('/',StaticFiles(directory=DIST,html=True),name='react')
