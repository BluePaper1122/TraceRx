"""Repeatable synthetic regression evaluation, distinct from live vision accuracy."""
import argparse
import json
from pathlib import Path
from .fixtures import demo_cases, DEMO_NOW, render_document
from .engine import evaluate, case_state
from .extraction import DemoAdapter, TextAdapter, OpenAIAdapter

EXPECTED = {'DEMO-101': 'Needs review', 'DEMO-102': 'Reviewed', 'DEMO-103': 'No trigger',
            'DEMO-104': 'No trigger', 'DEMO-105': 'Needs verification', 'DEMO-106': 'Needs review'}
FIELDS = ['patient_id', 'encounter_id', 'kind', 'occurred_at', 'order_end', 'medication',
          'report_status', 'result', 'report_id', 'reviewed_report_id', 'reviewed_order_id']

def run_evaluation(live=False):
    rules, extraction = [], []
    adapter = OpenAIAdapter() if live else TextAdapter()
    for case in demo_cases():
        actual = case_state(evaluate(case, DEMO_NOW))
        rules.append({'case': case.patient_id, 'expected': EXPECTED[case.patient_id], 'actual': actual,
                      'pass': actual == EXPECTED[case.patient_id]})
        for doc in case.documents:
            try:
                predicted = adapter.extract(render_document(doc)) if live else adapter.extract(doc.text)
                truth, pred = doc.event.model_dump(mode='json'), predicted.event.model_dump(mode='json')
                matched = sum(truth[f] == pred[f] for f in FIELDS)
                extraction.append({'document': doc.document_id, 'matched_fields': matched, 'total_fields': len(FIELDS),
                                   'exact_match': matched == len(FIELDS), 'error': None})
            except Exception as exc:
                extraction.append({'document': doc.document_id, 'matched_fields': 0, 'total_fields': len(FIELDS),
                                   'exact_match': False, 'error': type(exc).__name__})
    total = sum(r['total_fields'] for r in extraction)
    return {'scope': 'Live vision on synthetic PNGs' if live else 'Local text parser on synthetic labeled text; NOT VLM accuracy',
            'rule_accuracy': sum(r['pass'] for r in rules)/len(rules),
            'field_accuracy': sum(r['matched_fields'] for r in extraction)/total,
            'document_exact_match': sum(r['exact_match'] for r in extraction)/len(extraction),
            'rules': rules, 'extraction': extraction,
            'limitations': 'Small authored regression set. Not clinical validation, a representative document benchmark, or calibrated confidence.'}

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--live', action='store_true', help='Makes paid API calls using synthetic PNGs only')
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    report = run_evaluation(args.live)
    output = json.dumps(report, indent=2)
    if args.output:
        args.output.write_text(output)
    print(output)
    raise SystemExit(0 if report['rule_accuracy'] == 1 and report['field_accuracy'] == 1 else 1)
