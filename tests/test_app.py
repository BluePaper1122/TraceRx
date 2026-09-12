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
