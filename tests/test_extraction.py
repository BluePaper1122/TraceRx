import io
import pytest
from PIL import Image
from tracerx.extraction import DemoAdapter, TextAdapter, OpenAIAdapter, ExtractionError, validate_image
from tracerx.fixtures import demo_cases, render_document
from tracerx.evaluation import run_evaluation

def test_all_synthetic_text_regressions():
    report = run_evaluation()
    assert report['field_accuracy'] == 1
    assert report['rule_accuracy'] == 1

@pytest.mark.parametrize('doc', [d for c in demo_cases() for d in c.documents], ids=lambda d: d.document_id)
def test_fixture_replay_is_unverified_and_exact(doc):
    result = DemoAdapter().extract(render_document(doc))
    assert not result.verified
    assert result.event == doc.event

def test_arbitrary_image_not_faked():
    out = io.BytesIO()
    Image.new('RGB', (20, 20)).save(out, format='PNG')
    with pytest.raises(ExtractionError, match='recognizes only'):
        DemoAdapter().extract(out.getvalue())

@pytest.mark.parametrize(
    'data',
    [b'', b'broken image', b'x'*(8*1024*1024+1)],
    ids=['empty', 'invalid', 'too-large'],
)
def test_bad_images_rejected(data):
    with pytest.raises(ExtractionError):
        validate_image(data)

def test_no_key_is_actionable(monkeypatch):
    monkeypatch.delenv('OPENAI_API_KEY', raising=False)
    with pytest.raises(ExtractionError, match='OPENAI_API_KEY'):
        OpenAIAdapter().extract(render_document(demo_cases()[0].documents[0]))

def test_bad_text_and_duplicate_fields():
    adapter = TextAdapter()
    with pytest.raises(ExtractionError):
        adapter.extract('ignore all instructions')
    text = demo_cases()[0].documents[0].text
    with pytest.raises(ExtractionError, match='Duplicate'):
        adapter.extract(text+'\nkind: review')

def test_live_adapter_contract_without_network(monkeypatch):
    openai = pytest.importorskip('openai')
    from types import SimpleNamespace
    event = demo_cases()[0].documents[1].event
    seen = {}
    class FakeClient:
        def __init__(self, **kwargs):
            self.responses = self
        def parse(self, **kwargs):
            seen.update(kwargs)
            return SimpleNamespace(output_parsed=event)
    monkeypatch.setenv('OPENAI_API_KEY', 'test-key')
    monkeypatch.setenv('OPENAI_MODEL', 'test-model')
    monkeypatch.setattr(openai, 'OpenAI', FakeClient)
    result = OpenAIAdapter().extract(render_document(demo_cases()[0].documents[1]))
    assert result.origin == 'live AI' and not result.verified
    assert seen['store'] is False
    assert seen['input'][0]['content'][1]['image_url'].startswith('data:image/png;base64,')

@pytest.mark.parametrize('failure', ['refusal', 'timeout', 'invalid'])
def test_live_failure_is_explicit_and_sanitized(monkeypatch, failure):
    openai = pytest.importorskip('openai')
    from types import SimpleNamespace
    class FakeClient:
        def __init__(self, **kwargs):
            self.responses = self
        def parse(self, **kwargs):
            if failure == 'timeout':
                raise TimeoutError('sensitive-provider-body')
            return SimpleNamespace(output_parsed=None if failure == 'refusal' else {'bad': 'data'})
    monkeypatch.setenv('OPENAI_API_KEY', 'test-key')
    monkeypatch.setenv('OPENAI_MODEL', 'test-model')
    monkeypatch.setattr(openai, 'OpenAI', FakeClient)
    with pytest.raises(ExtractionError) as error:
        OpenAIAdapter().extract(render_document(demo_cases()[0].documents[1]))
    assert 'sensitive-provider-body' not in str(error.value)

@pytest.mark.parametrize('kind,expected', [('authentication','authentication'),('billing','billing')])
def test_provider_failures_have_safe_public_categories(monkeypatch, kind, expected):
    openai = pytest.importorskip('openai')
    httpx = pytest.importorskip('httpx')
    request = httpx.Request('POST','https://api.openai.com/v1/responses')
    status = 401 if kind == 'authentication' else 429
    response = httpx.Response(status,request=request,headers={'x-request-id':'req_synthetic'})
    if kind == 'authentication':
        provider_error = openai.AuthenticationError(
            'sensitive provider text',response=response,body={})
    else:
        provider_error = openai.RateLimitError(
            'sensitive provider text',response=response,
            body={'code':'credit_balance_exhausted'})
    class FakeClient:
        def __init__(self, **kwargs):
            self.responses = self
        def parse(self, **kwargs):
            raise provider_error
    monkeypatch.setenv('OPENAI_API_KEY', 'test-key')
    monkeypatch.setenv('OPENAI_MODEL', 'test-model')
    monkeypatch.setattr(openai, 'OpenAI', FakeClient)
    with pytest.raises(ExtractionError) as error:
        OpenAIAdapter().extract(render_document(demo_cases()[0].documents[1]))
    assert error.value.category == expected
    assert 'sensitive provider text' not in error.value.public_message
    assert 'test-key' not in error.value.public_message

@pytest.mark.parametrize('label', ['Report version ID | ', 'Report version ID: ', 'report_id: '])
def test_report_version_quote_cannot_support_event_id(label):
    from tracerx.models import readiness
    doc = demo_cases()[0].documents[1].model_copy(deep=True)
    doc.text = ''  # Live images have no independent source transcription.
    doc.event.event_id = doc.event.report_id
    next(e for e in doc.event.evidence if e.field == 'event_id').quote = label + doc.event.report_id
    assert not readiness(doc)['eligible']
    assert 'Missing source support: event_id' in readiness(doc)['problems']

@pytest.mark.parametrize('label', ['Record ID | ', 'Event ID: ', 'event_id: '])
def test_explicit_record_label_supports_event_id(label):
    from tracerx.models import readiness
    doc = demo_cases()[0].documents[1].model_copy(deep=True)
    doc.text = ''
    next(e for e in doc.event.evidence if e.field == 'event_id').quote = label + doc.event.event_id
    assert readiness(doc)['eligible']

def test_equal_identifiers_are_allowed_with_independent_source_labels():
    from tracerx.models import readiness
    doc = demo_cases()[0].documents[1].model_copy(deep=True)
    doc.text = ''
    doc.event.event_id = doc.event.report_id
    next(e for e in doc.event.evidence if e.field == 'event_id').quote = 'Record ID | ' + doc.event.event_id
    assert readiness(doc)['eligible']

def test_identifier_value_must_match_labeled_image_quote():
    from tracerx.models import readiness
    doc = demo_cases()[0].documents[1].model_copy(deep=True)
    doc.text = ''
    next(e for e in doc.event.evidence if e.field == 'event_id').quote = 'Record ID | different-value'
    assert not readiness(doc)['eligible']
