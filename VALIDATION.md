# Delivery validation

Validated locally on Python 3.14 with the package versions in `requirements-tested.txt`.

- **61 tests passed**, covering deterministic timing/linkage rules, source-readiness gates, schema rejection, fixture extraction, sanitized API failures, and Streamlit UI interactions.
- All five Streamlit screens render without application exceptions in AppTest.
- UI tests exercise recording a linked review and importing a verified replacement event.
- Local browser inspection confirmed the dashboard and patient workspace render; the dashboard reports six cases, two awaiting review, one requiring source verification and one reviewed case at the default clock.
- Default evaluation: **6/6 scenario states**, **165/165 compared extraction fields**, **15/15 exact document matches**. These are local labeled-text parser regressions on authored synthetic data, not live VLM measurements.
- Optional API request shape and failure paths were tested with a fake client. **No real API call was made**, and no live vision accuracy is claimed.

Use `python -m pytest -q` and `python -m resistlens.evaluation` to reproduce. This is software verification for a synthetic demo, not clinical validation.

## Follow-up reliability audit

Added five regression tests and fixed three uncovered behaviors: duplicate records no longer suppress unrelated review findings; future-dated records no longer create premature quality or duplicate warnings; re-extraction and JSON edits require a fresh source confirmation. All 60 tests pass. Unknown timestamps still require verification.

The guided Start here walkthrough is covered by an end-to-end UI test: no trigger, report arrives, simulated review, finish and restart; the patient workspace remains unchanged. The Mac launcher passes shell syntax validation.
