import hashlib
from copy import deepcopy
import pytest
from resistlens.benchmark import ROOT,FIELDS,load_manifest,base_documents,run_samples,score_event
from resistlens.extraction import ExtractionError

def test_manifest_split_hashes_and_labels():
    samples=load_manifest()
    assert len(samples)==48
    dev={s['base_id'] for s in samples if s['split']=='development'}
    test={s['base_id'] for s in samples if s['split']=='test'}
    assert len(dev)==len(test)==6 and not dev & test
    docs=base_documents()
    for s in samples:
        assert hashlib.sha256((ROOT/s['image']).read_bytes()).hexdigest()==s['sha256']
        assert s['truth']=={f:docs[int(s['base_id'][1:])-1].event.model_dump(mode='json')[f] for f in FIELDS}

class Fake:
    model='fake-client-only'
    def extract(self,data):
        return base_documents()[0]

class Failed:
    def extract(self,data):
        raise ExtractionError('private provider detail must not appear')

def test_scoring_failure_denominators_and_empty():
    sample=load_manifest()[0]
    assert run_samples([sample],Fake())['non_null_field_accuracy']==1
    r=run_samples([sample],Failed())
    assert r['field_accuracy']==r['non_null_field_accuracy']==0
    assert r['document_exact_match']==0 and r['failures']==1
    assert 'private provider' not in str(r)
    assert all(x['total']==1 and x['correct']==0 for x in r['per_field'].values())
    assert run_samples([],Fake())['field_accuracy'] is None

@pytest.mark.parametrize('damage',['hash','missing'])
def test_corrupt_or_missing_image_is_failure(damage):
    s=deepcopy(load_manifest()[0])
    if damage=='hash': s['sha256']='wrong'
    else: s['image']='images/nonexistent.png'
    assert run_samples([s],Fake())['failures']==1

def test_null_population_and_equivalent_offset():
    e=base_documents()[0].event
    truth={f:e.model_dump(mode='json')[f] for f in FIELDS}
    truth['occurred_at']='2026-08-01T03:00:00-05:00'
    e.result='invented'
    fields={f['field']:f for f in score_event(truth,e)}
    assert fields['occurred_at']['correct']
    assert fields['result']['unsupported_population']
