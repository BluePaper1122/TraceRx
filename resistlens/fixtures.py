"""Entirely invented training scenarios; no real patient data or clinical guidance."""
import hashlib
from datetime import datetime, timezone
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
from .models import ClinicalEvent, Evidence, Document, Case

DEMO_NOW = datetime(2026, 9, 11, 18, tzinfo=timezone.utc)

def make_document(patient, encounter, kind, eid, at, **kwargs):
    values = dict(event_id=eid, patient_id=patient, encounter_id=encounter, kind=kind, occurred_at=at,
                  order_end=None, medication=None, report_status=None, result=None, report_id=None,
                  reviewed_report_id=None, reviewed_order_id=None, reviewer=None, review_note=None)
    values.update(kwargs)
    lines = ['RESISTLENS | SYNTHETIC TRAINING DOCUMENT', 'Not a real clinical record', '']
    evidence = []
    for key, value in values.items():
        if value is not None:
            line = f'{key}: {value}'
            lines.append(line)
            evidence.append(Evidence(field=key, quote=line, page=1, confidence=1))
    text = '\n'.join(lines)
    return Document(document_id='doc-'+eid, title=f'{kind.title()} • {eid}', text=text,
        event=ClinicalEvent(**values, evidence=evidence), verified=True, origin='synthetic fixture',
        sha256=hashlib.sha256(text.encode()).hexdigest())

def demo_cases():
    cases = []
    scenarios = [
        ('DEMO-101', 'Evidence awaiting review', 'East • 3', 'A final report arrives after an active order. No linked review is available.'),
        ('DEMO-102', 'Review already documented', 'West • 2', 'The same temporal pattern has a source-verified review linked to the report and order.'),
        ('DEMO-103', 'Preliminary evidence only', 'East • 3', 'A preliminary result does not meet the final-evidence trigger.'),
        ('DEMO-104', 'Order ended before result', 'North • 1', 'The order is no longer active when final evidence arrives.'),
        ('DEMO-105', 'Uncertain document', 'West • 2', 'An incomplete publication timestamp must be verified, not silently treated as a safe case.'),
        ('DEMO-106', 'Amended evidence', 'North • 1', 'A review of an earlier report version does not close the newer amended evidence.'),
    ]
    for p, label, unit, story in scenarios:
        enc = 'ENC-'+p
        order = make_document(p, enc, 'order', p+'-O1', '2026-09-10T08:00:00+00:00', medication='Synthetic antimicrobial A',
                              order_end='2026-09-11T08:00:00+00:00' if p == 'DEMO-104' else None)
        report = make_document(p, enc, 'microbiology', p+'-M1', '2026-09-11T10:00:00+00:00',
                     report_status='preliminary' if p == 'DEMO-103' else 'final', report_id=p+'-R1',
                     result='Synthetic organism label X; training example only')
        docs = [order, report]
        if p in ('DEMO-102', 'DEMO-106'):
            docs.append(make_document(p, enc, 'review', p+'-V1', '2026-09-11T11:00:00+00:00',
                       reviewed_report_id=p+'-R1', reviewed_order_id=p+'-O1', reviewer='Demo reviewer',
                       review_note='Report reviewed in context of the active order; documentation example only.'))
        if p == 'DEMO-105':
            report.event.occurred_at = None
            report.event.evidence = [e for e in report.event.evidence if e.field != 'occurred_at']
            report.text = report.text.replace('occurred_at: 2026-09-11T10:00:00+00:00', 'occurred_at: unreadable')
            report.sha256 = hashlib.sha256(report.text.encode()).hexdigest()
            report.verified = False
        if p == 'DEMO-106':
            docs.append(make_document(p, enc, 'microbiology', p+'-M2', '2026-09-11T14:00:00+00:00',
                report_status='amended', report_id=p+'-R2', result='Amended synthetic laboratory label Y'))
        cases.append(Case(patient_id=p, encounter_id=enc, label=label, unit=unit, story=story, documents=docs))
    return cases

def render_document(doc):
    """Generate readable, downloadable PNG pages without any network or font dependency."""
    import textwrap
    image = Image.new('RGB', (1200, 1050), '#f8fafc')
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, 1200, 100), fill='#123d44')
    font = ImageFont.load_default(size=21)
    titlefont = ImageFont.load_default(size=32)
    draw.text((45, 30), 'RESISTLENS / TRAINING RECORD', font=titlefont, fill='white')
    y = 135
    for line in doc.text.splitlines()[2:]:
        for part in textwrap.wrap(line, width=85) or ['']:
            draw.text((45, y), part, font=font, fill='#183940')
            y += 34
    draw.text((45, 995), 'SYNTHETIC DATA ONLY  |  NOT FOR CLINICAL USE', font=font, fill='#8d4b16')
    out = BytesIO()
    image.save(out, format='PNG')
    return out.getvalue()
