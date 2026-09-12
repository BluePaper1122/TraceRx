"""Deterministic synthetic vision benchmark. No patient data and no model training."""
import argparse
import hashlib
import json
import time
from datetime import datetime, timedelta, timezone
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
from .fixtures import make_document
from .extraction import OpenAIAdapter, ExtractionError

ROOT = Path(__file__).resolve().parents[1] / 'benchmark_data'
FIELDS = ['event_id', 'patient_id', 'encounter_id', 'kind', 'occurred_at', 'order_end',
          'medication', 'report_status', 'result', 'report_id', 'reviewed_report_id',
          'reviewed_order_id', 'reviewer', 'review_note']
LABELS = {'event_id':'Record ID', 'patient_id':'Patient ID', 'encounter_id':'Encounter ID',
          'kind':'Document category', 'occurred_at':'Event publication/start time', 'order_end':'Order end time',
          'medication':'Ordered antimicrobial', 'report_status':'Report status', 'result':'Reported finding',
          'report_id':'Report version ID', 'reviewed_report_id':'Reviewed report version ID',
          'reviewed_order_id':'Reviewed order ID', 'reviewer':'Reviewer', 'review_note':'Review documentation'}

def base_documents():
    docs = []
    for i in range(12):
        p, enc = f'BENCH-{i+1:03}', f'VISIT-{i+1:03}'
        at = (datetime(2026, 8, 1, 8, tzinfo=timezone.utc)+timedelta(days=i, hours=i%5)).isoformat()
        kind = ['order', 'microbiology', 'review'][i%3]
        extra = {}
        if kind == 'order':
            extra = {'medication': f'Synthetic antimicrobial {chr(65+i)}',
                     'order_end': (datetime.fromisoformat(at)+timedelta(days=2)).isoformat() if i%2 else None}
        elif kind == 'microbiology':
            extra = {'report_status': ['final','preliminary','amended','unknown'][i//3],
                     'result': f'Synthetic laboratory finding {i+1}; not a clinical interpretation', 'report_id': f'LAB-{i+1}-v1'}
        else:
            extra = {'reviewed_report_id':f'LAB-{i+1}-v1','reviewed_order_id':f'ORDER-{i+1}',
                     'reviewer':f'Synthetic reviewer {i+1}', 'review_note':'Reviewed this report in the context of the linked order. No treatment recommendation recorded.'}
        doc = make_document(p, enc, kind, f'RECORD-{i+1}', at, **extra)
        # An explicitly missing timestamp tests abstention rather than guessing.
        if i == 11:
            doc.event.occurred_at = None
        docs.append(doc)
    return docs

def render_page(event, layout):
    import textwrap
    page = Image.new('RGB',(1500,1600),'white')
    draw = ImageDraw.Draw(page)
    font = ImageFont.load_default(size=25)
    header = ImageFont.load_default(size=38)
    colors = ['#173b49','#384a73','#325b4e']
    draw.rectangle((0,0,1500,115),fill=colors[layout])
    draw.text((55,35),['NORTH LAB / TRAINING','SYNTHETIC RECORD CENTER','TRAINING DOCUMENT / WEST'][layout],font=header,fill='white')
    draw.text((55,140),'FICTIONAL DATA — NOT A REAL CLINICAL RECORD',font=font,fill='#7b3434')
    items = list(FIELDS)
    if layout == 1:
        items = items[3:]+items[:3]
    elif layout == 2:
        items = list(reversed(items))
    values = event.model_dump(mode='json')
    y = 205
    for field in items:
        value = values[field]
        if value is None and field != 'occurred_at':
            continue
        label = LABELS[field]
        display = str(value) if value is not None else '[not documented]'
        line = label+('  |  ' if layout == 1 else ': ')+display
        for part in textwrap.wrap(line, width=88):
            draw.text((60,y),part,font=font,fill='#172a32')
            y += 40
        y += 16
    draw.line((55,1490,1445,1490), fill='#b2bdc3',width=2)
    draw.text((55,1520),'Synthetic benchmark v1 • page 1 • timestamps include explicit UTC offset',font=font,fill='#53636c')
    return page

def generate(root=ROOT):
    root = Path(root)
    (root/'images').mkdir(parents=True, exist_ok=True)
    rows = []
    for i, doc in enumerate(base_documents()):
        base = render_page(doc.event, i%3)
        variants = {
            'clean': base,
            'blur': base.filter(ImageFilter.GaussianBlur(radius=2.4)),
            'low_resolution': base.resize((450,480),Image.Resampling.LANCZOS).resize(base.size,Image.Resampling.BILINEAR),
            'rotated_low_contrast': ImageEnhance.Contrast(base.rotate(3,Image.Resampling.BICUBIC,expand=False,fillcolor='white')).enhance(.45),
        }
        for variant, img in variants.items():
            sample_id = f'B{i+1:02}-{variant}'
            path = root/'images'/f'{sample_id}.png'
            img.save(path,format='PNG')
            rows.append({'sample_id':sample_id,'base_id':f'B{i+1:02}', 'split':'development' if i<6 else 'test',
                         'variant':variant,'layout':i%3,'image':f'images/{sample_id}.png',
                         'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
                         'truth':{f:doc.event.model_dump(mode='json')[f] for f in FIELDS}})
    (root/'manifest.json').write_text(json.dumps(rows,indent=2))
    return rows

def load_manifest(root=ROOT):
    return json.loads((Path(root)/'manifest.json').read_text())

def score_event(truth, event):
    pred = event.model_dump(mode='json')
    fields = []
    for f in FIELDS:
        expected, actual = truth[f], pred[f]
        if f in ('occurred_at','order_end') and expected is not None and actual is not None:
            equal = datetime.fromisoformat(expected) == datetime.fromisoformat(actual)
        else:
            equal = expected == actual
        fields.append({'field':f,'expected':expected,'actual':actual,'correct':equal,
                       'unsupported_population':expected is None and actual is not None})
    return fields

def run_samples(samples, adapter, root=ROOT, on_progress=None):
    results=[]
    for index, sample in enumerate(samples):
        started=time.monotonic()
        try:
            data=(Path(root)/sample['image']).read_bytes()
            if hashlib.sha256(data).hexdigest() != sample['sha256']:
                raise ExtractionError('Benchmark image checksum mismatch')
            doc=adapter.extract(data)
            fields=score_event(sample['truth'],doc.event)
            results.append({'sample_id':sample['sample_id'],'variant':sample['variant'],'split':sample['split'],
                            'success':True,'fields':fields,'seconds':round(time.monotonic()-started,2),
                            'extraction':doc.model_dump(mode='json')})
        except ExtractionError as exc:
            results.append({'sample_id':sample['sample_id'],'variant':sample['variant'],'split':sample['split'],
                            'success':False,'fields':[], 'seconds':round(time.monotonic()-started,2),
                            'error_type':exc.category,'error':exc.public_message})
        except OSError:
            results.append({'sample_id':sample['sample_id'],'variant':sample['variant'],'split':sample['split'],
                            'success':False,'fields':[], 'seconds':round(time.monotonic()-started,2),
                            'error_type':'source','error':'The benchmark image could not be read. Verify the deployed dataset files.'})
        if on_progress:
            on_progress(index+1,len(samples))
    return summarize(results, getattr(adapter,'model',None))

def summarize(results, model=None):
    scored=[r for r in results if r['success']]
    denominator=len(scored)*len(FIELDS)
    fields=[f for r in scored for f in r['fields']]
    by_variant={}
    for variant in sorted({r['variant'] for r in results}):
        group=[r for r in results if r['variant']==variant]
        scored_group=[r for r in group if r['success']]
        by_variant[variant]={'documents':len(group), 'scored_documents':len(scored_group),
                             'field_accuracy':sum(f['correct'] for r in scored_group for f in r['fields'])/(len(scored_group)*len(FIELDS)) if scored_group else None,
                             'failures':sum(not r['success'] for r in group)}
    return {'model':model,'created_at':datetime.now(timezone.utc).isoformat(), 'documents':len(results),
            'scored_documents':len(scored),
            'field_accuracy':sum(f['correct'] for f in fields)/denominator if denominator else None,
            'non_null_field_accuracy':sum(f['correct'] for f in fields if f['expected'] is not None)/sum(f['expected'] is not None for f in fields) if any(f['expected'] is not None for f in fields) else None,
            'per_field':{name:{'correct':sum(f['correct'] for f in fields if f['field']==name),'total':len(scored)} for name in FIELDS},
            'document_exact_match':sum(all(f['correct'] for f in r['fields']) for r in scored)/len(scored) if scored else None,
            'unsupported_populations':sum(f['unsupported_population'] for f in fields),
            'failures':sum(not r['success'] for r in results), 'by_variant':by_variant, 'results':results,
            'scope':'Live VLM extraction on authored synthetic images; no fine-tuning or clinical validation. Failed calls are reported separately and excluded from accuracy denominators. Quote accuracy needs human inspection.'}

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--generate',action='store_true')
    parser.add_argument('--live',action='store_true')
    parser.add_argument('--split',choices=['development','test'],default='development')
    parser.add_argument('--limit',type=int,default=3)
    parser.add_argument('--output',type=Path,default=Path('benchmark-result.json'))
    args=parser.parse_args()
    if args.generate:
        print(f'Generated {len(generate())} synthetic images.')
    if args.live:
        if not 1<=args.limit<=24:
            parser.error('Limit must be between 1 and 24 per run')
        samples=[s for s in load_manifest() if s['split']==args.split][:args.limit]
        report=run_samples(samples,OpenAIAdapter())
        args.output.write_text(json.dumps(report,indent=2))
        print(json.dumps({k:v for k,v in report.items() if k!='results'},indent=2))
        raise SystemExit(1 if report['failures'] else 0)
