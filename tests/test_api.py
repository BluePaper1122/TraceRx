"""API boundary tests; all fixtures synthetic and no paid network calls."""
import io
import json
from zipfile import ZipFile
import pytest
from fastapi.testclient import TestClient
from resistlens.api import app, SESSIONS
from resistlens.fixtures import demo_cases

@pytest.fixture
def client():
    SESSIONS.clear()
    with TestClient(app) as c:
        token = c.post('/api/session').json()['token']
        c.headers['Authorization'] = 'Bearer '+token
        yield c
    SESSIONS.clear()

def test_session_isolation_and_auth(client):
    other=client.post('/api/session').json()['token']
    assert client.post('/api/clock',json={'offset':4}).json()['offset']==4
    assert client.get('/api/state',headers={'Authorization':'Bearer '+other}).json()['offset']==36
    assert client.get('/api/state',headers={'Authorization':'bad'}).status_code==401
    assert client.delete('/api/session').status_code==200
    assert client.get('/api/state').status_code==401

def test_key_never_returned_or_exported(client,monkeypatch):
    from resistlens import api
    monkeypatch.setattr(api.OpenAIAdapter,'verify_connection',lambda self:'fake-model')
    secret='fake-test-key-not-real'
    assert client.post('/api/connection',json={'api_key':secret,'model':'fake-model'}).status_code==200
    assert secret not in client.get('/api/state').text
    assert secret not in client.get('/api/export/session').text
    z=ZipFile(io.BytesIO(client.get('/api/export/evidence').content))
    assert secret.encode() not in z.read('session.json')
    invalid=client.post('/api/connection',json={'api_key':secret})
    assert invalid.status_code==422 and secret not in invalid.text
    client.delete('/api/connection')
    assert not client.get('/api/state').json()['connection']['configured']

def test_connection_is_not_saved_when_verification_fails(client,monkeypatch):
    from resistlens import api
    monkeypatch.setattr(api.OpenAIAdapter,'verify_connection',lambda self:'fake-model')
    assert client.post('/api/connection',json={
        'api_key':'older-fake-secret','model':'gpt-4.1-mini'}).status_code==200
    def fail(self):
        raise api.ExtractionError(
            'private provider response',category='authentication',
            public_message='The AI provider rejected the API key.')
    monkeypatch.setattr(api.OpenAIAdapter,'verify_connection',fail)
    r=client.post('/api/connection',json={'api_key':'fake-secret','model':'gpt-4.1-mini'})
    assert r.status_code==422
    assert r.json()['detail']=='The AI provider rejected the API key.'
    assert 'fake-secret' not in r.text and 'private provider response' not in r.text
    assert not client.get('/api/state').json()['connection']['configured']

def test_extract_import_requires_verification_and_explicit_replace(client):
    doc=demo_cases()[0].documents[0]
    extracted=client.post('/api/extract',json={'mode':'text','text':doc.text}).json()
    body={'attempt':extracted['attempt'],'event':extracted['document']['event'],'verified':False}
    assert client.post('/api/import',json=body).status_code==400
    body['verified']=True
    assert client.post('/api/import',json=body).status_code==409
    body['replace']=True
    r=client.post('/api/import',json=body)
    assert r.status_code==200
    assert len(r.json()['cases'][0]['documents'])==2
    assert client.post('/api/import',json=body).status_code==409

def test_live_consent_required_before_provider(client):
    r=client.post('/api/extract',json={'mode':'live','sample_id':'DEMO-101-O1'})
    assert r.status_code==400 and 'consent' in r.text
    assert client.post('/api/benchmark/run',json={'ids':['B01-clean'],'consent':False}).status_code==400

def test_review_links_and_guide_isolation(client):
    before=client.get('/api/state').json()
    assert client.get('/api/guide/2').json()['findings'][0]['state']=='Reviewed'
    assert client.get('/api/state').json()==before
    body={'patient_id':'DEMO-101','order_id':'DEMO-101-O1','report_id':'wrong','reviewer':'Demo reviewer','note':'Source checked','confirmed':True}
    assert client.post('/api/review',json=body).status_code==409
    body['report_id']='DEMO-101-R1'
    r=client.post('/api/review',json=body)
    assert r.status_code==200 and r.json()['cases'][0]['state']=='Reviewed'
    assert client.post('/api/review',json=body).status_code==409

def test_mock_ledger_and_exports(client):
    body={'patient_id':'DEMO-101','scenario':'Transfer records unavailable'}
    before=client.post('/api/risk',json=body).json()
    after=client.post('/api/risk',json={**body,'lookup':True}).json()
    assert before['lookup'] is None
    assert after['lookup']['state']=='verified'
    assert before['prediction']['final_score']!=after['prediction']['final_score']
    for kind in ['samples','dataset','evidence']:
        r=client.get('/api/export/'+kind)
        assert r.status_code==200 and ZipFile(io.BytesIO(r.content)).testzip() is None

def test_incremental_benchmark(client,monkeypatch):
    from resistlens import api
    class Fake:
        model='fake-model'
    monkeypatch.setattr(api,'adapter',lambda s:Fake())
    monkeypatch.setattr(api,'run_samples',lambda rows,a:{'results':[{'sample_id':r['sample_id'],'split':r['split'],'variant':r['variant'],'success':False,'fields':[{'field':k,'expected':v,'actual':None,'correct':False,'unsupported_population':False} for k,v in r['truth'].items()]} for r in rows]})
    rows=api.load_manifest()
    first=client.post('/api/benchmark/run',json={'ids':[rows[0]['sample_id']],'consent':True}).json()
    assert first['documents']==1
    second=client.post('/api/benchmark/run',json={'ids':[rows[1]['sample_id']],'consent':True,'restart':False}).json()
    assert second['documents']==2 and second['scored_documents']==0 and second['failures']==2
    assert second['field_accuracy'] is None
    assert client.post('/api/benchmark/run',json={'ids':[rows[1]['sample_id']],'consent':True,'restart':False}).status_code==409
