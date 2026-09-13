from datetime import timedelta, datetime
import pytest
from tracerx.fixtures import demo_cases, DEMO_NOW, make_document
from tracerx.models import ClinicalEvent, readiness
from tracerx.engine import evaluate, case_state
from tracerx.evaluation import EXPECTED

@pytest.mark.parametrize('case', demo_cases(), ids=lambda c: c.patient_id)
def test_authored_cases(case):
    assert case_state(evaluate(case, DEMO_NOW)) == EXPECTED[case.patient_id]

@pytest.mark.parametrize('time,expected', [(DEMO_NOW-timedelta(hours=9), 'No trigger'), (DEMO_NOW-timedelta(hours=8), 'Needs review')])
def test_report_arrival_boundary(time, expected):
    assert case_state(evaluate(demo_cases()[0], time)) == expected

def test_future_review_does_not_clear():
    case = demo_cases()[1]
    assert case_state(evaluate(case, DEMO_NOW-timedelta(hours=7, minutes=30))) == 'Needs review'

def test_review_before_report_does_not_clear():
    case = demo_cases()[1]
    case.documents[2] = make_document(case.patient_id, case.encounter_id, 'review', 'early', '2026-09-11T09:00:00+00:00',
        reviewed_report_id='DEMO-102-R1', reviewed_order_id='DEMO-102-O1', reviewer='Demo', review_note='Reviewed previous context')
    assert case_state(evaluate(case, DEMO_NOW)) == 'Needs review'

@pytest.mark.parametrize('field,value', [('reviewed_order_id','another-order'), ('reviewed_report_id','another-report')])
def test_exact_review_linkage(field, value):
    case = demo_cases()[1]
    setattr(case.documents[2].event, field, value)
    assert any(f.state == 'Needs review' for f in evaluate(case, DEMO_NOW))

def test_patient_mismatch_quarantined():
    case = demo_cases()[1]
    case.documents[2].event.patient_id = 'different-patient'
    fs = evaluate(case, DEMO_NOW)
    assert any(f.state == 'Needs verification' for f in fs)
    assert any(f.state == 'Needs review' for f in fs)

def test_unverified_review_never_clears():
    case = demo_cases()[1]
    case.documents[2].verified = False
    assert any(f.state == 'Needs review' for f in evaluate(case, DEMO_NOW))

def test_low_confidence_is_not_no_trigger():
    case = demo_cases()[0]
    case.documents[1].event.evidence[0].confidence = .2
    assert case_state(evaluate(case, DEMO_NOW)) == 'Needs verification'

def test_duplicate_event_blocks_clearance():
    case = demo_cases()[1]
    case.documents.append(case.documents[1].model_copy(deep=True))
    assert case_state(evaluate(case, DEMO_NOW)) == 'Needs verification'

def test_order_end_exclusive():
    case = demo_cases()[0]
    case.documents[0] = make_document(case.patient_id, case.encounter_id, 'order', 'DEMO-101-O1',
        '2026-09-10T08:00:00+00:00', medication='Synthetic antimicrobial A', order_end=DEMO_NOW.isoformat())
    assert case_state(evaluate(case, DEMO_NOW)) == 'No trigger'

def test_report_at_start_does_not_trigger():
    case = demo_cases()[0]
    case.documents[1] = make_document(case.patient_id, case.encounter_id, 'microbiology', 'M',
        '2026-09-10T08:00:00+00:00', report_status='final', report_id='R', result='Synthetic')
    assert case_state(evaluate(case, DEMO_NOW)) == 'No trigger'

def test_multiple_orders_need_separate_links():
    case = demo_cases()[1]
    case.documents.append(make_document(case.patient_id, case.encounter_id, 'order', 'O2',
        '2026-09-10T09:00:00+00:00', medication='Synthetic antimicrobial B'))
    fs = evaluate(case, DEMO_NOW)
    assert any(f.state == 'Reviewed' for f in fs)
    assert any(f.state == 'Needs review' and f.order_id == 'O2' for f in fs)

def test_naive_clock_rejected():
    with pytest.raises(ValueError):
        evaluate(demo_cases()[0], datetime(2026, 9, 11))

def test_schema_rejects_extra_and_naive_timestamps():
    data = demo_cases()[0].documents[0].event.model_dump()
    with pytest.raises(ValueError):
        ClinicalEvent.model_validate(dict(data, unexpected='value'))
    with pytest.raises(ValueError):
        ClinicalEvent.model_validate(dict(data, occurred_at='2026-09-11T10:00:00'))
    with pytest.raises(ValueError):
        ClinicalEvent.model_validate(dict(data, order_end='2026-09-09T10:00:00+00:00'))

def test_fabricated_quote_rejected():
    doc = demo_cases()[0].documents[0]
    doc.event.evidence[1].quote = 'not in source'
    assert not readiness(doc)['eligible']

def test_value_must_match_labeled_quote():
    doc = demo_cases()[0].documents[0]
    doc.event.medication = 'Invented replacement'
    assert not readiness(doc)['eligible']

def test_unknown_report_status_requires_verification():
    case = demo_cases()[0]
    case.documents[1] = make_document(case.patient_id, case.encounter_id, 'microbiology', 'M',
        '2026-09-11T10:00:00+00:00', report_status='unknown', report_id='R', result='Synthetic')
    assert case_state(evaluate(case, DEMO_NOW)) == 'Needs verification'

def test_duplicate_report_version_requires_reconciliation():
    case = demo_cases()[1]
    case.documents.append(make_document(case.patient_id, case.encounter_id, 'microbiology', 'M2',
        '2026-09-11T12:00:00+00:00', report_status='amended', report_id='DEMO-102-R1', result='Amended'))
    assert case_state(evaluate(case, DEMO_NOW)) == 'Needs verification'

def test_unverified_end_cannot_silence_flag():
    case = demo_cases()[0]
    case.documents[0].event.order_end = DEMO_NOW
    assert case_state(evaluate(case, DEMO_NOW)) == 'Needs verification'

def test_future_uncertain_record_does_not_affect_snapshot():
    case = demo_cases()[0]
    future = make_document(case.patient_id, case.encounter_id, 'microbiology', 'FUTURE',
        '2026-09-12T10:00:00+00:00', report_status='unknown', report_id='FUTURE-R', result='Synthetic')
    future.verified = False
    case.documents.append(future)
    fs = evaluate(case, DEMO_NOW)
    assert not any(f.state == 'Needs verification' for f in fs)
    assert any(f.state == 'Needs review' for f in fs)

def test_duplicate_records_do_not_hide_unrelated_flag():
    case = demo_cases()[0]
    other = make_document(case.patient_id, case.encounter_id, 'microbiology', 'DUP',
        '2026-09-11T11:00:00+00:00', report_status='final', report_id='DUP-R', result='Synthetic')
    case.documents += [other, other.model_copy(deep=True)]
    fs = evaluate(case, DEMO_NOW)
    assert any(f.state == 'Needs verification' for f in fs)
    assert any(f.state == 'Needs review' and f.report_id == 'DEMO-101-R1' for f in fs)

def test_future_duplicate_does_not_quarantine_current_report():
    case = demo_cases()[0]
    future = make_document(case.patient_id, case.encounter_id, 'microbiology', 'DEMO-101-M1',
        '2026-09-12T10:00:00+00:00', report_status='final', report_id='DEMO-101-R1', result='Synthetic')
    case.documents.append(future)
    assert case_state(evaluate(case, DEMO_NOW)) == 'Needs review'
