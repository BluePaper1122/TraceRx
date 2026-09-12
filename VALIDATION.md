# Validation — 2026-09-12

Fresh local run: **95 passed in 5.10s**, Python 3.14, existing task environment (`../../work/venv/bin/python -m pytest -q`). Earlier 60/61-test counts were historical. Python 3.12 is configured in CI; its result must be checked separately after push.

- Preserved all 61 baseline checks. Added 34 checks for risk decay boundaries, future/unrelated evidence, S/I/R math, lower/upper clamp, context-specific baseline, exposure windows and double-count suppression, missing-data states, MRSA dated clearance, schema rejection and duplicate IDs.
- Benchmark checks verify all 48 hashes and labels, split isolation, failure denominators, per-field/non-null scoring, null hallucinations, equivalent timestamp offsets, empty selections and unavailable/corrupt files. These use fake adapters and do not measure VLM accuracy.
- Ledger tests cover unknown token, denied requester, copy isolation, tamper detection and duplicate registration.
- Streamlit AppTest covers all eight destinations, key save/forget and separate sessions, empty evaluation selections, scorecard scenarios, transfer resolution, new-patient import and conflicting-encounter rejection, plus the original guided walkthrough/review/replacement flows.
- Fresh `python -m resistlens.evaluation`: **6/6 scenario states, 165/165 compared parser fields, 15/15 exact documents**. The 15 documents belong to six patients, not 15 independent risk cases.
- Visual inspection of B03 clean and rotated/low-contrast PNGs: scored fields readable and not clipped. Decorative punctuation has missing-glyph boxes in the original dataset; existing images/hashes were preserved. This is a two-image spot check, not all-image visual validation.

No real API request was made. No clinical calibration, quote-faithfulness measurement, live extraction-to-workflow evaluation, hospital integration, durable ledger or hosted multi-user validation is claimed. The synthetic score coefficients and clearance thresholds are implementation-plan assumptions.
