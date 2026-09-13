from datetime import timedelta
import pytest
from pydantic import ValidationError
from tracerx.fixtures import DEMO_NOW as NOW
from tracerx.risk_models import *
from tracerx.risk_engine import calculate_drug_risk, decay_weight
from tracerx.risk_ui import demo_profile
from tracerx.ledger import MockLedger

@pytest.mark.parametrize('category,days,expected',[
    ('routine',6*30.44,1),('routine',6*30.44+.01,.5),('routine',12*30.44,.5),
    ('routine',12*30.44+.01,.2),('high_consequence',12*30.44,1),
    ('high_consequence',12*30.44+.01,.8),('mrsa',900,1),('routine',-1,0)])
def test_decay_boundaries(category,days,expected):
    assert decay_weight(category,NOW-timedelta(days=days),NOW)==expected

@pytest.mark.parametrize('scenario,score,flag',[
    ('Not tested',.15,'DATA_GAP_UNORDERED'),('Aged positive',.22,'AGED_POSITIVE'),
    ('Transfer records unavailable',.15,'DATA_UNAVAILABLE'),('MRSA persistence',.50,'BASELINE_UNAVAILABLE'),
    ('MRSA clearance',.15,'BASELINE_UNAVAILABLE')])
def test_traps_and_arithmetic(scenario,score,flag):
    result=calculate_drug_risk(demo_profile('SYN',scenario),'Demo drug A','Demo class A',NOW)
    assert result.final_score==pytest.approx(score)
    assert flag in result.data_quality_flags
    assert sum(f.adjustment for f in result.reasoning_chain)==pytest.approx(score)

def culture(result='R', days=10, organism='Synthetic organism'):
    return PriorCultureRecord(record_id='c1',source_quote='Synthetic culture',observed_at=NOW-timedelta(days=days),
        organism=organism,specimen='Synthetic',category='routine',susceptibility={'Demo drug A':result})

@pytest.mark.parametrize('sir,expected',[('R',.6),('I',.3),('S',.01)])
def test_culture_and_clamp(sir,expected):
    p=demo_profile('SYN','Not tested');p.cultures=[culture(sir)]
    r=calculate_drug_risk(p,'Demo drug A','Demo class A',NOW)
    assert r.final_score==pytest.approx(expected)
    assert sum(f.adjustment for f in r.reasoning_chain)==pytest.approx(expected)

@pytest.mark.parametrize('days,organism',[(-1,'Synthetic organism'),(1,'Other organism')])
def test_future_and_unrelated_cultures_excluded(days,organism):
    p=demo_profile('SYN','Not tested');p.cultures=[culture(days=days,organism=organism)]
    assert calculate_drug_risk(p,'Demo drug A','Demo class A',NOW).final_score==.15

@pytest.mark.parametrize('ended_days,expected',[(90,.3),(90.01,.15)])
def test_exposure_window(ended_days,expected):
    p=demo_profile('SYN','Not tested')
    p.exposures=[AntibioticExposureRecord(record_id='e',source_quote='Synthetic exposure',medication_class='Demo class A',
        observed_at=NOW-timedelta(days=100),ended_at=NOW-timedelta(days=ended_days))]
    assert calculate_drug_risk(p,'Demo drug A','Demo class A',NOW).final_score==pytest.approx(expected)

def test_resistant_culture_does_not_double_count_exposure():
    p=demo_profile('SYN','Not tested');p.cultures=[culture()]
    p.exposures=[AntibioticExposureRecord(record_id='e',source_quote='Synthetic exposure',medication_class='Demo class A',
        observed_at=NOW-timedelta(days=20),ended_at=NOW)]
    r=calculate_drug_risk(p,'Demo drug A','Demo class A',NOW)
    assert r.final_score==pytest.approx(.6)
    assert r.reasoning_chain[-1].adjustment==0

def test_future_clearance_does_not_clear():
    p=demo_profile('SYN','MRSA clearance');p.colonizations[0].negative_rescreen_at=NOW+timedelta(days=1)
    assert calculate_drug_risk(p,'Demo drug A','Demo class A',NOW).final_score==.5

def test_invalid_schema_and_duplicate_ids():
    with pytest.raises(ValidationError):
        culture().model_validate({**culture().model_dump(),'observed_at':'2026-09-01T00:00:00'})
    with pytest.raises(ValidationError):
        demo_profile('SYN','Not tested').model_validate({**demo_profile('SYN','Not tested').model_dump(),'cultures':[culture(),culture()]})

def test_ledger_access_missing_tamper_and_copy():
    ledger=MockLedger();payload={'fictional':'record'}
    ledger.register('opaque-demo-token','B',payload,{'A'})
    payload['fictional']='changed'
    assert ledger.lookup('missing','A')['state']=='not_found'
    assert ledger.lookup('opaque-demo-token','C')=={'state':'access_denied'}
    result=ledger.lookup('opaque-demo-token','A')
    assert result['payload']=={'fictional':'record'}
    result['payload']['fictional']='changed'
    assert ledger.lookup('opaque-demo-token','A')['state']=='verified'
    ledger._records['opaque-demo-token'][1]['fictional']='tampered'
    assert ledger.lookup('opaque-demo-token','A')=={'state':'verification_failed'}
    with pytest.raises(ValueError):
        ledger.register('opaque-demo-token','B',{}, {'A'})

def test_baseline_exact_context_and_upper_clamp():
    p=demo_profile('SYN','MRSA persistence');p.cultures=[culture()]
    b=AntibiogramBaseline(record_id='base',source_quote='Synthetic baseline 40%',observed_at=NOW,
        unit_id=p.unit_id,organism=p.organism,medication='Demo drug A',infection_type=p.infection_type,resistance_rate=.4)
    r=calculate_drug_risk(p,'Demo drug A','Demo class A',NOW,[b])
    assert r.baseline_score==.4 and r.final_score==.99
    assert sum(f.adjustment for f in r.reasoning_chain)==pytest.approx(.99)
    b.unit_id='Unrelated unit'
    assert calculate_drug_risk(p,'Demo drug A','Demo class A',NOW,[b]).baseline_score==.15

def test_latest_matching_culture_and_future_baseline():
    p=demo_profile('SYN','Not tested')
    old=culture('R',50);old.record_id='old'
    p.cultures=[old,culture('S',1)]
    assert calculate_drug_risk(p,'Demo drug A','Demo class A',NOW).final_score==.01
    with pytest.raises(ValueError):
        calculate_drug_risk(p,'Demo drug A','Demo class A',NOW.replace(tzinfo=None))
