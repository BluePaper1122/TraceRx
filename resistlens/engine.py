"""Temporal workflow rule v1.0. No diagnosis, susceptibility logic or prescribing."""
from datetime import datetime
from collections import Counter
from .models import Case, Finding, readiness

RULE_VERSION = '1.0'

def evaluate(case: Case, as_of: datetime) -> list[Finding]:
    if as_of.tzinfo is None:
        raise ValueError('Evaluation clock must include a timezone')
    findings, accepted = [], []
    # Known future events cannot affect the current snapshot, including quality
    # warnings and duplicate detection. Unknown times still need verification.
    visible = [d for d in case.documents if d.event.occurred_at is None or d.event.occurred_at <= as_of]
    event_counts = Counter(d.event.event_id for d in visible)
    report_counts = Counter(d.event.report_id for d in visible
                            if d.event.kind == 'microbiology' and d.event.report_id is not None)
    for doc in visible:
        e = doc.event
        duplicate_event = event_counts[e.event_id] > 1
        duplicate_report = e.kind == 'microbiology' and e.report_id is not None and report_counts[e.report_id] > 1
        if duplicate_event or duplicate_report:
            findings.append(Finding(state='Needs verification', report_id=e.report_id, order_id=None,
                reason='Duplicate event or report-version identifier; reconcile these documents. Unrelated evidence is still evaluated.',
                evidence_ids=[doc.document_id]))
            continue
        quality = readiness(doc)
        if e.patient_id != case.patient_id or e.encounter_id != case.encounter_id:
            quality['problems'].append('Patient or encounter does not match this case')
        if quality['problems']:
            findings.append(Finding(state='Needs verification', report_id=e.report_id, order_id=None,
                                    reason='; '.join(quality['problems']), evidence_ids=[doc.document_id]))
        elif e.occurred_at <= as_of:
            accepted.append(doc)
    orders = [d for d in accepted if d.event.kind == 'order']
    reviews = [d for d in accepted if d.event.kind == 'review']
    reports = [d for d in accepted if d.event.kind == 'microbiology']
    for report in reports:
        r = report.event
        if r.report_status not in ('final', 'amended'):
            continue
        for order in orders:
            o = order.event
            # End is exclusive. A report must arrive strictly after order start.
            if not (o.occurred_at < r.occurred_at and (o.order_end is None or as_of < o.order_end)):
                continue
            matching = [d for d in reviews if d.event.reviewed_report_id == r.report_id
                        and d.event.reviewed_order_id == o.event_id and d.event.occurred_at >= r.occurred_at]
            if matching:
                review = min(matching, key=lambda d: d.event.occurred_at)
                findings.append(Finding(state='Reviewed', report_id=r.report_id, order_id=o.event_id,
                    reason='A source-verified review explicitly links this order and evidence version after publication.',
                    evidence_ids=[order.document_id, report.document_id, review.document_id]))
            else:
                findings.append(Finding(state='Needs review', report_id=r.report_id, order_id=o.event_id,
                    reason='Final or amended microbiology evidence arrived after order start; the order remains active and no verified, linked review is documented in the available record.',
                    evidence_ids=[order.document_id, report.document_id],
                    hours_open=round((as_of-r.occurred_at).total_seconds()/3600, 1)))
    if not findings:
        findings.append(Finding(state='No trigger', report_id=None, order_id=None,
            reason='No qualifying active-order / final-evidence pair at this demo time. This is not a judgment of clinical safety.', evidence_ids=[]))
    return findings

def case_state(findings):
    for state in ['Needs verification', 'Needs review', 'Reviewed', 'No trigger']:
        if any(f.state == state for f in findings):
            return state
