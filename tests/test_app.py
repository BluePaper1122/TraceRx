from pathlib import Path
from streamlit.testing.v1 import AppTest

APP = str(Path(__file__).resolve().parents[1] / 'app.py')

def test_all_screens_render():
    app = AppTest.from_file(APP, default_timeout=30).run()
    assert not app.exception
    for page in ['Patient workspace', 'Document studio', 'Evaluation lab', 'About & demo', 'Overview']:
        app.sidebar.radio[0].set_value(page).run()
        assert not app.exception, page

def test_documented_review_closes_flag():
    app = AppTest.from_file(APP, default_timeout=30).run()
    app.sidebar.radio[0].set_value('Patient workspace').run()
    assert any('Needs review' in w.value for w in app.warning)
    app.text_input[0].set_value('Yiyi demo')
    app.text_area[0].set_value('Reviewed the displayed synthetic report in context of this order.')
    # Reset checkbox is first, review confirmation second.
    next(c for c in app.checkbox if c.label.startswith('I reviewed')).check()
    next(b for b in app.button if b.label == 'Record source-linked review').click().run()
    assert not app.exception
    assert any('Reviewed' in s.value for s in app.success)
    assert len(app.session_state['audit']) == 1

def test_studio_replay_and_import():
    app = AppTest.from_file(APP, default_timeout=30).run()
    app.sidebar.radio[0].set_value('Document studio').run()
    next(b for b in app.button if b.label == 'Extract document').click().run()
    assert not app.exception
    assert 'pending' in app.session_state
    next(c for c in app.checkbox if c.label.startswith('I checked')).check()
    next(c for c in app.checkbox if c.label.startswith('Replace an')).check().run()
    next(b for b in app.button if b.label == 'Verify and add to matching case').click().run()
    assert not app.exception
    assert any('Verified event added' in s.value for s in app.success)

def test_repeat_extraction_resets_confirmation():
    app = AppTest.from_file(APP, default_timeout=30).run()
    app.sidebar.radio[0].set_value('Document studio').run()
    next(b for b in app.button if b.label == 'Extract document').click().run()
    next(c for c in app.checkbox if c.label.startswith('I checked')).check().run()
    assert next(c for c in app.checkbox if c.label.startswith('I checked')).value
    next(b for b in app.button if b.label == 'Extract document').click().run()
    assert not next(c for c in app.checkbox if c.label.startswith('I checked')).value

def test_editing_extraction_requires_new_confirmation():
    app = AppTest.from_file(APP, default_timeout=30).run()
    app.sidebar.radio[0].set_value('Document studio').run()
    next(b for b in app.button if b.label == 'Extract document').click().run()
    next(c for c in app.checkbox if c.label.startswith('I checked')).check().run()
    editor = next(t for t in app.text_area if t.label == 'Editable validated JSON')
    editor.set_value(editor.value+' ').run()
    assert not next(c for c in app.checkbox if c.label.startswith('I checked')).value

def test_guided_walkthrough_uses_real_rule_engine():
    app = AppTest.from_file(APP, default_timeout=30).run()
    assert app.sidebar.radio[0].value == 'Start here'
    assert any('No trigger' in x.value for x in app.info)
    for label, expected in [('Next: show the final report', 'Needs review'), ('Record a demo review', 'Reviewed')]:
        next(b for b in app.button if b.label == label).click().run()
        assert not app.exception
        assert any(expected in x.value for x in list(app.warning)+list(app.success))
    assert len(app.session_state['cases'][0].documents) == 2
    next(b for b in app.button if b.label == 'Finish walkthrough').click().run()
    next(b for b in app.button if b.label == 'Restart walkthrough').click().run()
    assert any('No trigger' in x.value for x in app.info)

def test_live_pages_empty_selection_and_session_connection():
    app=AppTest.from_file(APP,default_timeout=30).run()
    app.sidebar.radio[0].set_value('AI connection').run()
    assert not app.exception
    app.text_input[0].set_value('synthetic-test-key-not-real')
    app.text_input[1].set_value('fake-model')
    next(b for b in app.button if b.label=='Save connection for this session').click().run()
    assert app.session_state['live_model']=='fake-model'
    app.sidebar.radio[0].set_value('Vision benchmark').run()
    assert not app.exception
    app.multiselect[0].set_value([]).run()
    assert next(b for b in app.button if b.label=='Run real VLM evaluation').disabled
    other=AppTest.from_file(APP,default_timeout=30).run()
    assert 'live_key' not in other.session_state
    app.sidebar.radio[0].set_value('AI connection').run()
    next(b for b in app.button if b.label=='Forget my API key').click().run()
    assert 'live_key' not in app.session_state

def test_trap_scorecard_and_transfer_lookup():
    app=AppTest.from_file(APP,default_timeout=30).run()
    app.sidebar.radio[0].set_value('Patient workspace').run()
    selector=next(s for s in app.selectbox if s.label=='Synthetic risk scenario')
    for scenario in ['Aged positive','MRSA persistence','MRSA clearance','Transfer records unavailable']:
        selector.set_value(scenario).run()
        assert not app.exception
        selector=next(s for s in app.selectbox if s.label=='Synthetic risk scenario')
    assert any('Records Unavailable' in e.value for e in app.error)
    next(b for b in app.button if b.label=='Cross-hospital ledger lookup (mock)').click().run()
    assert not app.exception
    assert not any('Records Unavailable' in e.value for e in app.error)
    assert any('fingerprint verified' in s.value for s in app.success)
    assert next(m for m in app.metric if m.label=='Illustrative score / 100').value=='60.0'
    assert len(app.session_state['cases'][0].documents)==2

def test_import_new_patient_and_reject_conflicting_encounter():
    from resistlens.fixtures import make_document, DEMO_NOW
    for patient,encounter,accepted in [('SYN-NEW','SYN-VISIT',True),('DEMO-101','OTHER-VISIT',False)]:
        app=AppTest.from_file(APP,default_timeout=30).run()
        app.sidebar.radio[0].set_value('Document studio').run()
        next(r for r in app.radio if r.label=='Extraction mode').set_value('Local synthetic text').run()
        doc=make_document(patient,encounter,'order','SYN-NEW-ORDER',DEMO_NOW.isoformat(),medication='Synthetic drug')
        app.text_area[0].set_value(doc.text)
        next(b for b in app.button if b.label=='Extract document').click().run()
        next(c for c in app.checkbox if c.label.startswith('I checked')).check().run()
        next(b for b in app.button if b.label=='Verify and add to matching case').click().run()
        assert not app.exception
        assert len(app.session_state['cases'])==(7 if accepted else 6)
        if not accepted:
            assert any('different encounter' in e.value for e in app.error)
