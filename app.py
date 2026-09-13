"""Run: streamlit run app.py"""
import hashlib
import json
import os
import uuid
from datetime import timedelta, datetime, timezone
from html import escape
from io import BytesIO
from zipfile import ZipFile
import pandas as pd
import streamlit as st
from tracerx.models import ClinicalEvent, readiness
from tracerx.fixtures import demo_cases, DEMO_NOW, render_document, make_document
from tracerx.engine import evaluate, case_state, RULE_VERSION
from tracerx.extraction import DemoAdapter, TextAdapter, OpenAIAdapter, ExtractionError
from tracerx.evaluation import run_evaluation
from tracerx.integrations import integration_status
from tracerx.live_ui import connection_page, benchmark_page, live_adapter

st.set_page_config(page_title='TraceRx · Evidence to action', page_icon='◉', layout='wide')
st.markdown('''<style>
.block-container{padding-top:2.1rem;max-width:1440px}h1{letter-spacing:-1.7px!important;font-weight:750!important}
h2,h3{letter-spacing:-.5px}.eyebrow{color:#087f8c;font-size:12px;font-weight:750;letter-spacing:2.2px}
.hero{background:linear-gradient(115deg,#12333f,#125e63);border-radius:20px;padding:32px 38px;color:white;margin:0 0 24px}
.hero h1{color:white;font-size:44px;margin:0}.hero p{color:#d1e6e7;max-width:740px;font-size:17px;margin-bottom:5px}
.hero .eyebrow{color:#89d9c8}.tag{display:inline-block;padding:5px 12px;border-radius:20px;background:#ffffff18;font-size:12px;margin:16px 7px 0 0;color:#e0f6f2}
[data-testid="stMetric"]{background:white;border:1px solid #dde7ea;border-radius:14px;padding:18px}
[data-testid="stMetricLabel"]{color:#536f79}.timeline{border-left:3px solid #90c9c8;padding:0 0 20px 22px;margin-left:9px}
.timeline .stamp{font-size:12px;color:#607b84}.timeline .event{font-weight:700;font-size:17px;margin:4px 0}
.timeline .detail{font-size:14px;color:#47636b}.foot{font-size:12px;color:#687e88;margin-top:24px}
[data-testid="stSidebar"]{border-right:1px solid #dce6e9}button{border-radius:9px!important}
</style>''', unsafe_allow_html=True)

if 'cases' not in st.session_state:
    st.session_state.cases = demo_cases()
    st.session_state.audit = []
    st.session_state.source_images = {}

def audit(action, detail, **changes):
    st.session_state.audit.append({'recorded_at_utc': datetime.now(timezone.utc).isoformat(),
                                 'action': action, 'detail': detail, **changes})

with st.sidebar:
    st.markdown('## ◉ TraceRx')
    st.caption('ANTIMICROBIAL STEWARDSHIP')
    page = st.radio('Navigate', ['Start here', 'Overview', 'Patient workspace', 'Document studio', 'Evaluation lab', 'AI connection', 'Vision benchmark', 'About & demo'], label_visibility='collapsed')
    st.divider()
    st.markdown('**Demo clock**')
    offset = st.slider('Hours since Sep 10, 06:00 UTC', 0, 48, 36)
    as_of = DEMO_NOW + timedelta(hours=offset-36)
    st.caption(as_of.strftime('%d %b %Y · %H:%M UTC'))
    st.caption('Move time to watch evidence arrive. All timing is a simulation, not a clinical deadline.')
    st.divider()
    st.success('Offline demo ready')
    st.caption('Live adapter configured' if st.session_state.get('live_key') and st.session_state.get('live_model') else 'No API key needed')
    reset = st.checkbox('Allow resetting this session')
    if st.button('Reset demo', disabled=not reset, width='stretch'):
        for key in list(st.session_state.keys()):
            del st.session_state[key]
        st.rerun()
    st.caption('Session memory only. Export before closing or resetting.')

st.markdown('''<div class="hero"><div class="eyebrow">TRACERX · EVIDENCE REVIEW</div>
<h1>Close the evidence-to-review gap.</h1><p>New microbiology evidence. An active antimicrobial order. A clear, traceable answer to whether review was documented.</p>
<span class="tag">Source-linked evidence</span><span class="tag">Deterministic workflow rules</span><span class="tag">Human verification</span></div>''', unsafe_allow_html=True)
st.caption('Research demonstration only • Synthetic data • Does not diagnose, prescribe, or recommend medication changes. “No trigger” does not establish clinical safety.')
cases = st.session_state.cases
all_findings = {c.patient_id: evaluate(c, as_of) for c in cases}

if page == 'Start here':
    st.subheader('Explore the review workflow')
    st.write('Follow a synthetic case from an active order to new evidence and a documented review.')
    st.caption('This walkthrough has its own clock and example. It does not change your patient workspace or use the sidebar clock.')
    step = st.session_state.get('guide_step', 0)
    st.progress((step+1)/4, text=f'Step {step+1} of 4')
    titles = ['An antimicrobial order is active', 'A final report arrives', 'A review is documented', 'You have completed the demonstration']
    descriptions = [
        'The synthetic order started yesterday. At 09:00 today the final report has not arrived. There is no review trigger yet.',
        'At 10:00 a final microbiology report arrives. The order is active, but there is no linked review in this example. The yellow message identifies that documentation gap.',
        'A simulated review is now linked to this exact report and order. The workflow recognizes the documented review.',
        'The story is: new evidence → visible review gap → documented review. You can repeat it or use the navigation on the left to explore the full app.'
    ]
    st.markdown('### '+titles[step])
    st.write(descriptions[step])
    guided_case = demo_cases()[0]
    guided_time = DEMO_NOW - timedelta(hours=9 if step == 0 else 8 if step == 1 else 7)
    if step >= 2:
        guided_case.documents.append(make_document(guided_case.patient_id, guided_case.encounter_id, 'review', 'GUIDED-REVIEW',
            guided_time.isoformat(), reviewed_report_id='DEMO-101-R1', reviewed_order_id='DEMO-101-O1',
            reviewer='Simulated walkthrough reviewer', review_note='Simulated review for the guided demonstration only.'))
    for finding in evaluate(guided_case, guided_time):
        {'No trigger': st.info, 'Needs review': st.warning, 'Reviewed': st.success, 'Needs verification': st.error}[finding.state](finding.state+' — '+finding.reason)
    with st.expander('See the source documents used in this step'):
        for document in guided_case.documents:
            if document.event.occurred_at and document.event.occurred_at <= guided_time:
                st.code(document.text, language=None)
    if step < 3:
        label = ['Next: show the final report', 'Record a demo review', 'Finish walkthrough'][step]
        if st.button(label, type='primary'):
            st.session_state.guide_step = step+1
            st.rerun()
    if step > 0 and st.button('Restart walkthrough'):
        st.session_state.guide_step = 0
        st.rerun()
    st.markdown('Explore **Patient workspace** to review evidence, **Document studio** to extract a synthetic report, or **Overview** to see the full queue.')
    st.caption('No API key, upload or typing is needed for this walkthrough. All reviews here are simulated; no medication is changed.')

elif page == 'AI connection':
    connection_page()

elif page == 'Vision benchmark':
    benchmark_page()

elif page == 'Overview':
    st.subheader('Stewardship overview')
    st.write('A shared view of evidence, review documentation, and records that need verification.')
    cols = st.columns(4)
    counts = [len(cases), sum(any(f.state == 'Needs review' for f in fs) for fs in all_findings.values()),
              sum(any(f.state == 'Needs verification' for f in fs) for fs in all_findings.values()),
              sum(case_state(fs) == 'Reviewed' for fs in all_findings.values())]
    for col, label, value in zip(cols, ['Synthetic cases', 'Awaiting review', 'Verify source', 'Reviewed cases'], counts):
        col.metric(label, value)
    left, right = st.columns([3, 1])
    with left:
        st.markdown('### Work queue')
        filters = st.multiselect('Filter states', ['Needs review', 'Needs verification', 'Reviewed', 'No trigger'])
        unit = st.selectbox('Unit', ['All units'] + sorted({c.unit for c in cases}))
        rows = []
        for case in cases:
            fs = all_findings[case.patient_id]
            states = {f.state for f in fs}
            if filters and not states.intersection(filters) or unit != 'All units' and case.unit != unit:
                continue
            rows.append({'Patient': case.patient_id, 'Scenario': case.label, 'Unit': case.unit,
                         'State': case_state(fs), 'Open pairs': sum(f.state == 'Needs review' for f in fs),
                         'Readiness / 100': round(sum(readiness(d)['score'] for d in case.documents)/len(case.documents))})
        frame = pd.DataFrame(rows)
        st.dataframe(frame, hide_index=True, width='stretch')
        st.download_button('Export queue CSV', frame.to_csv(index=False), 'tracerx-queue.csv', 'text/csv')
    with right:
        st.markdown('### How it works')
        st.markdown('**01 · Capture**\n\nRead a synthetic document or replay a bundled image.\n\n**02 · Verify**\n\nInspect extracted fields beside source evidence.\n\n**03 · Reconcile**\n\nMatch final evidence to active orders and linked reviews.')
        st.info('Flags describe missing documentation in the available record, not inappropriate treatment.')
    with st.expander('Session activity & export'):
        st.dataframe(pd.DataFrame([{k: row[k] for k in ('recorded_at_utc', 'action', 'detail')} for row in st.session_state.audit]), width='stretch', hide_index=True)
        bundle = {'as_of': as_of.isoformat(), 'rule_version': RULE_VERSION,
                  'cases': [c.model_dump(mode='json') for c in cases], 'audit': st.session_state.audit}
        st.download_button('Export complete session JSON', json.dumps(bundle, indent=2), 'tracerx-session.json', 'application/json')
        source_bundle = BytesIO()
        with ZipFile(source_bundle, 'w') as archive:
            archive.writestr('session.json', json.dumps(bundle, indent=2))
            for digest, image_bytes in st.session_state.source_images.items():
                archive.writestr('sources/'+digest+('.png' if image_bytes.startswith(b'\x89PNG') else '.jpg'), image_bytes)
        st.download_button('Export session with source images', source_bundle.getvalue(), 'tracerx-evidence.zip', 'application/zip')

elif page == 'Patient workspace':
    selected = st.selectbox('Synthetic patient', [c.patient_id for c in cases], format_func=lambda pid: next(f'{c.patient_id} · {c.label}' for c in cases if c.patient_id == pid))
    case = next(c for c in cases if c.patient_id == selected)
    st.subheader(case.label)
    st.write(case.story)
    st.caption(f'{case.patient_id} / {case.encounter_id} · {case.unit}')
    findings = all_findings[selected]
    for f in findings:
        message = f'{f.state} — {f.reason}'
        if f.hours_open is not None:
            message += f' Evidence age: {f.hours_open:g} hours (not an urgency score).'
        {'Needs review': st.warning, 'Needs verification': st.error, 'Reviewed': st.success, 'No trigger': st.info}[f.state](message)
    timeline, evidence_tab, review_tab, risk_tab = st.tabs(['Event timeline', 'Evidence & reasoning', 'Document a review', 'Synthetic risk scorecard'])
    with risk_tab:
        from tracerx.risk_ui import scorecard
        scorecard(selected, as_of)
    with timeline:
        for d in sorted(case.documents, key=lambda d: d.event.occurred_at or datetime.max.replace(tzinfo=timezone.utc)):
            e = d.event
            future = bool(e.occurred_at and e.occurred_at > as_of)
            stamp = e.occurred_at.astimezone(timezone.utc).strftime('%d %b · %H:%M UTC') if e.occurred_at else 'Time unreadable'
            detail = e.medication or e.result or e.review_note or 'Incomplete record'
            st.markdown(f'<div class="timeline"><div class="stamp">{escape(stamp)} {"· FUTURE / excluded" if future else ""}</div><div class="event">{escape(e.kind.title())} · {escape(e.event_id)}</div><div class="detail">{escape(detail)}</div></div>', unsafe_allow_html=True)
        st.caption('Order end is exclusive. Future events are shown for the demo but excluded from evaluation.')
    with evidence_tab:
        st.markdown('**Rule v1.0**: verified final/amended report + later than order start + order active at evaluation time + no subsequent verified review linked to both IDs → needs review.')
        st.dataframe(pd.DataFrame([f.model_dump() for f in findings]), hide_index=True, width='stretch')
        for doc in case.documents:
            with st.expander(doc.title):
                q = readiness(doc)
                st.progress(q['score']/100, text=f"Readiness {q['score']}/100 · heuristic, not probability of correctness")
                st.caption(f'Origin: {doc.origin} · Source verified: {doc.verified} · SHA-256: {doc.sha256}')
                a, b = st.columns(2)
                with a:
                    if doc.text:
                        st.code(doc.text, language=None)
                    else:
                        image_bytes = st.session_state.source_images.get(doc.sha256)
                        if image_bytes:
                            st.image(image_bytes, width='stretch')
                        else:
                            st.caption('No source image retained in this session.')
                with b:
                    st.dataframe(pd.DataFrame([e.model_dump() for e in doc.event.evidence]), hide_index=True, width='stretch')
                if q['problems']:
                    st.warning('; '.join(q['problems']))
    with review_tab:
        open_pairs = [f for f in findings if f.state == 'Needs review']
        if not open_pairs:
            st.info('No open review pair at the current demo time.')
        else:
            chosen = st.selectbox('Evidence / order pair', range(len(open_pairs)), format_func=lambda i: f'{open_pairs[i].report_id} → {open_pairs[i].order_id}')
            with st.form('review_form'):
                reviewer = st.text_input('Demo reviewer name', max_chars=80)
                note = st.text_area('Review documentation', placeholder='Document that the evidence was reviewed in context of this order. Do not enter real patient data.', max_chars=1500)
                confirmed = st.checkbox('I reviewed the displayed source evidence for this synthetic order/report pair.')
                submit = st.form_submit_button('Record source-linked review', type='primary')
            if submit:
                if not reviewer.strip() or not note.strip() or not confirmed:
                    st.error('Provide a reviewer, documentation, and source-review confirmation.')
                else:
                    pair = open_pairs[chosen]
                    doc = make_document(case.patient_id, case.encounter_id, 'review', 'REV-'+uuid.uuid4().hex[:10],
                          as_of.isoformat(), reviewed_report_id=pair.report_id, reviewed_order_id=pair.order_id,
                          reviewer=reviewer.strip(), review_note=note.strip())
                    doc.origin = 'human review'
                    case.documents.append(doc)
                    audit('Review recorded', f'{case.patient_id}: {pair.report_id} / {pair.order_id}; demo time {as_of.isoformat()}')
                    st.rerun()

elif page == 'Document studio':
    st.subheader('From document to verifiable evidence')
    st.write('Extract a synthetic report, inspect the structured fields, and verify the source before adding it to a case.')
    samples = [d for c in demo_cases() for d in c.documents]
    sample_id = st.selectbox('Bundled sample', range(len(samples)), format_func=lambda i: samples[i].title)
    sample = samples[sample_id]
    with st.expander('Sample image & downloads', expanded=False):
        st.image(render_document(sample), width=650)
        a, b = st.columns(2)
        a.download_button('Download sample PNG', render_document(sample), sample.event.event_id+'.png', 'image/png')
        b.download_button('Download sample text', sample.text, sample.event.event_id+'.txt', 'text/plain')
    mode = st.radio('Extraction mode', ['Offline fixture replay', 'Local synthetic text', 'Live AI vision'], horizontal=True)
    st.caption({'Offline fixture replay': 'Deterministic lookup of unchanged bundled images. This is not OCR or an AI result.',
                'Local synthetic text': 'Parses explicit field labels locally; supports edits to the synthetic training format.',
                'Live AI vision': 'Sends the selected image to OpenAI only when you click Extract. Requires optional dependencies, API key and model. Results remain unverified.'}[mode])
    upload = None
    if mode == 'Local synthetic text':
        text_input = st.text_area('Synthetic source text', sample.text, height=260, key='source_text_'+str(sample_id))
        source_data = text_input.encode()
    else:
        upload = st.file_uploader('Optional synthetic image (PNG or JPEG, up to 8 MB)', type=['png', 'jpg', 'jpeg'])
        source_data = upload.getvalue() if upload else render_document(sample)
    source_token = hashlib.sha256(source_data + mode.encode()).hexdigest()
    if mode == 'Live AI vision':
        consent = st.checkbox('This image contains only synthetic data and I authorize sending it to the configured API.')
    else:
        consent = True
    if st.button('Extract document', type='primary', disabled=not consent):
        st.session_state.pop('pending', None)
        try:
            with st.spinner('Extracting and validating fields…'):
                adapter = live_adapter() if mode == 'Live AI vision' else {'Offline fixture replay': DemoAdapter, 'Local synthetic text': TextAdapter}[mode]()
                document = adapter.extract(text_input if mode == 'Local synthetic text' else source_data)
            st.session_state.pending = {'token': source_token, 'doc': document, 'attempt': uuid.uuid4().hex}
            audit('Extraction completed', f'{mode}; source {document.sha256[:12]}')
        except ExtractionError as exc:
            st.error(str(exc))
    pending = st.session_state.get('pending')
    if pending and pending['token'] == source_token:
        doc = pending['doc']
        attempt = pending['attempt']
        a, b = st.columns([1, 1])
        with a:
            st.markdown('### Source')
            if mode == 'Local synthetic text':
                st.code(doc.text, language=None)
            else:
                st.image(source_data, width='stretch')
        with b:
            st.markdown('### Structured event')
            st.caption('Correct values and their quoted evidence together. Source quotes must be exact. Null means unknown.')
            edited = st.text_area('Editable validated JSON', doc.event.model_dump_json(indent=2), height=400, key='json_'+attempt)
            st.dataframe(pd.DataFrame([e.model_dump() for e in doc.event.evidence]), hide_index=True, width='stretch')
        confirm = st.checkbox('I checked every required value, timestamp, ID and quote against the displayed synthetic source.', key='verify_'+attempt+hashlib.sha256(edited.encode()).hexdigest())
        replace = st.checkbox('Replace an existing event with the same ID (if present).', key='replace_'+attempt)
        if st.button('Verify and add to matching case', disabled=not confirm):
            try:
                event = ClinicalEvent.model_validate_json(edited)
                candidate = doc.model_copy(deep=True)
                candidate.event = event
                candidate.verified = True
                quality = readiness(candidate)
                if not quality['eligible']:
                    raise ValueError('; '.join(quality['problems']))
                target = next((c for c in cases if c.patient_id == event.patient_id and c.encounter_id == event.encounter_id), None)
                if target is None and any(c.patient_id == event.patient_id for c in cases):
                    raise ValueError('This patient already has a different encounter in the workspace. Use a distinct synthetic patient ID or a new session; encounters are never merged.')
                if target is None:
                    from tracerx.models import Case
                    target = Case(patient_id=event.patient_id, encounter_id=event.encounter_id, label='Imported synthetic case', unit='Imported', story='Source-verified synthetic documents imported through Document studio.', documents=[])
                    cases.append(target)
                previous = [d for d in target.documents if d.event.event_id == event.event_id]
                if previous and not replace:
                    raise ValueError('This event already exists. Select replacement explicitly or use a new source event.')
                target.documents = [d for d in target.documents if d.event.event_id != event.event_id] + [candidate]
                if mode != 'Local synthetic text':
                    st.session_state.source_images[candidate.sha256] = source_data
                audit('Source verified and imported', f'{target.patient_id}: {event.event_id}; source {candidate.sha256[:12]}', before=[d.model_dump(mode='json') for d in previous], after=candidate.model_dump(mode='json'))
                st.session_state.pop('pending', None)
                st.success('Verified event added. Open Patient workspace to see the updated timeline and rule result.')
            except ValueError as exc:
                st.error(f'Not imported: {exc}')

elif page == 'Evaluation lab':
    st.subheader('Extraction & workflow evaluation')
    st.write('Run repeatable extraction and workflow checks against the original synthetic fixtures. Session edits do not alter the ground truth.')
    report = run_evaluation()
    a, b, c = st.columns(3)
    a.metric('Rule scenario accuracy', f"{report['rule_accuracy']:.0%}")
    b.metric('Local parser field accuracy', f"{report['field_accuracy']:.0%}")
    c.metric('Local parser exact documents', f"{report['document_exact_match']:.0%}")
    st.info(report['scope'] + '. These numbers are regression checks, not evidence of clinical performance.')
    st.dataframe(pd.DataFrame(report['rules']), hide_index=True, width='stretch')
    with st.expander('Document-level results'):
        st.dataframe(pd.DataFrame(report['extraction']), hide_index=True, width='stretch')
    st.download_button('Download evaluation JSON', json.dumps(report, indent=2), 'evaluation.json', 'application/json')
    st.markdown('**Evaluate live extraction:** save a session connection in **AI connection**, then select synthetic images in **Vision benchmark**. API charges may apply. Live accuracy is reported only after an actual run.')
    st.caption(report['limitations'])

else:
    st.subheader('About TraceRx')
    st.markdown('TraceRx is a workflow visibility tool: it asks whether new final microbiology evidence has a documented review associated with an active antimicrobial order. It does not infer infection, resistance, treatment appropriateness, or medication changes.')
    st.markdown('### Explore the workflow')
    st.markdown('1. **Overview:** introduce the six synthetic scenarios and work queue.\n2. **Patient workspace / DEMO-101:** move the clock to hour 27, then 28. The final report arrives and the review flag appears.\n3. **Evidence & reasoning:** show both source IDs, exact quotes, and the deterministic rule.\n4. **Document a review:** enter a demo reviewer and source-linked note. The status becomes Reviewed.\n5. **DEMO-102 and DEMO-105:** contrast a documented review with an unreadable timestamp.\n6. **Document studio:** extract a bundled image offline, disclose fixture replay, and show verification.\n7. **Evaluation lab:** show regression results and distinguish them from live AI performance.')
    st.markdown('### Readiness is transparent')
    st.write('Score = required-field source coverage × minimum reported field confidence × 100. The 0.80 confidence cutoff is a demo configuration, not a validated clinical threshold. Eligibility also requires complete fields, source evidence, human verification, and matching patient/encounter IDs. Image quotes require visual human verification; source-text quotes are checked for literal presence.')
    st.markdown('### Boundaries & extension points')
    st.json(integration_status())
    st.write('Single-user session memory; no login, hospital integration, durable audit service, PDF ingestion, or real patient support. PNG/JPEG inputs cover screenshots and photographed reports. All times require explicit timezone offsets. Review linkage is exact to an order ID and report-version ID.')
    st.markdown('### Download the synthetic source pack')
    out = BytesIO()
    with ZipFile(out, 'w') as archive:
        for case in demo_cases():
            for doc in case.documents:
                archive.writestr(doc.event.event_id+'.png', render_document(doc))
                archive.writestr(doc.event.event_id+'.txt', doc.text)
    st.download_button('Download training documents', out.getvalue(), 'tracerx-synthetic-documents.zip', 'application/zip')

st.markdown('<div class="foot">TRACERX · Source-linked evidence review · Synthetic data only</div>', unsafe_allow_html=True)
