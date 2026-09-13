"""Validated extraction and workflow contracts. No treatment knowledge lives here."""
import re
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, AwareDatetime, model_validator

class StrictModel(BaseModel):
    model_config = ConfigDict(extra='forbid', validate_assignment=True)

class Evidence(StrictModel):
    field: str
    quote: str = Field(min_length=1)
    page: int = Field(ge=1)
    confidence: float = Field(ge=0, le=1)

class ClinicalEvent(StrictModel):
    event_id: str = Field(min_length=1, max_length=100, description="The source Record ID or Event ID for this event. Do not substitute the Report version ID. Quote the corresponding record/event label.")
    patient_id: str | None
    encounter_id: str | None
    kind: Literal['order', 'microbiology', 'review']
    occurred_at: AwareDatetime | None
    order_end: AwareDatetime | None
    medication: str | None
    report_status: Literal['preliminary', 'final', 'amended', 'unknown'] | None
    result: str | None
    report_id: str | None = Field(description="The microbiology Report version ID, distinct in meaning from the Record ID/event_id. Null when absent. Quote the report-version label.")
    reviewed_report_id: str | None
    reviewed_order_id: str | None
    reviewer: str | None
    review_note: str | None
    evidence: list[Evidence]

    @model_validator(mode='after')
    def coherent(self):
        if self.order_end and self.occurred_at and self.order_end < self.occurred_at:
            raise ValueError('Order end cannot precede start')
        fields = [e.field for e in self.evidence]
        if len(fields) != len(set(fields)):
            raise ValueError('Duplicate field provenance')
        if any(f not in type(self).model_fields or f == 'evidence' for f in fields):
            raise ValueError('Unknown provenance field')
        return self

class Document(StrictModel):
    document_id: str
    title: str
    text: str
    event: ClinicalEvent
    verified: bool = False
    origin: Literal['synthetic fixture', 'local text parser', 'live AI', 'human review']
    sha256: str

class Case(StrictModel):
    patient_id: str
    encounter_id: str
    label: str
    unit: str
    story: str
    documents: list[Document]

class Finding(StrictModel):
    state: Literal['Needs review', 'Reviewed', 'No trigger', 'Needs verification']
    report_id: str | None
    order_id: str | None
    reason: str
    evidence_ids: list[str]
    hours_open: float | None = None

REQUIRED = {
    'order': ['patient_id', 'encounter_id', 'occurred_at', 'medication'],
    'microbiology': ['patient_id', 'encounter_id', 'occurred_at', 'report_status', 'report_id', 'result'],
    'review': ['patient_id', 'encounter_id', 'occurred_at', 'reviewed_report_id', 'reviewed_order_id', 'reviewer', 'review_note'],
}

def readiness(doc: Document) -> dict:
    event = doc.event
    fields = ['event_id', 'kind'] + REQUIRED[event.kind]
    if event.kind == 'order' and event.order_end is not None:
        fields = fields + ['order_end']
    evidence = {e.field: e for e in event.evidence}
    missing = [f for f in fields if getattr(event, f) in (None, '')]
    unsupported = [f for f in fields if f not in evidence]
    # Recognized explicit ID labels must support the field they are attached to.
    # Do not require different ID values: independently labeled IDs may coincide.
    id_labels = {'record id': 'event_id', 'event id': 'event_id', 'event_id': 'event_id',
                 'report version id': 'report_id', 'report_id': 'report_id'}
    for item in event.evidence:
        if item.field not in ('event_id', 'report_id'):
            continue
        match = re.match(r'^\s*(Record ID|Event ID|event_id|Report version ID|report_id)\s*[:|]\s*(.*?)\s*$', item.quote, re.IGNORECASE)
        if match and (id_labels[match[1].lower()] != item.field or match[2] != getattr(event, item.field)):
            unsupported.append(item.field)
    # For text documents the quoted span must actually occur in the source.
    unsupported += [f for f in fields if f in evidence and doc.text and evidence[f].quote not in doc.text]
    # In the labeled synthetic format, also verify that a field's value agrees
    # with its quote. For free-form image text this remains a human check.
    for f in fields:
        if f not in evidence or not evidence[f].quote.startswith(f + ': '):
            continue
        quoted = evidence[f].quote.split(': ', 1)[1]
        actual = getattr(event, f)
        if isinstance(actual, datetime):
            try:
                agrees = datetime.fromisoformat(quoted.replace('Z', '+00:00')) == actual
            except ValueError:
                agrees = False
        else:
            agrees = str(actual) == quoted
        if not agrees:
            unsupported.append(f)
    confidence = min((evidence[f].confidence for f in fields if f in evidence), default=0.0)
    complete = (len(fields) - len(set(missing + unsupported))) / len(fields)
    score = round(100 * complete * confidence)
    problems = [f'Missing value: {f}' for f in missing] + [f'Missing source support: {f}' for f in set(unsupported)]
    if event.kind == 'microbiology' and event.report_status in (None, 'unknown'):
        problems.append('Report status is unknown')
    if confidence < .8:
        problems.append('Extraction confidence below demo threshold (0.80)')
    if not doc.verified:
        problems.append('Human source verification required')
    return {'score': score, 'confidence': confidence, 'eligible': not problems, 'problems': problems}
