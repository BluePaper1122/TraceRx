# ResistLens: document-to-code reconciliation and execution plan

This audit uses both attached AGENT_CONTEXT.md versions, the attached implementation plan, the actual local repository and authenticated GitHub inspection on 2026-09-12. Source and fresh tests take precedence over narrative claims.

## Repository evidence at arrival

Local checkout: `/Users/ysun26/Documents/Codex/2026-09-11/referenced-chatgpt-conversation-this-is-an/outputs/resistlens`, branch main, HEAD `d475ee1`. Actual remote main was `5d997b9fe9b7933d964c8461f083d6db1437df7d`, a README-only edit. Fetched and fast-forwarded that edit without disturbing local modifications. A pre-edit archive was saved in this task's work directory.

| Area | Actual state at arrival | Work in this task |
|---|---|---|
| Workflow engine | Committed: active-order/final-or-amended pairing, exact version review linkage, verification/future/duplicate safeguards | Preserved; regression suite still passes |
| UI and offline ingestion | Committed: six synthetic cases, guided tour, queue, timeline, reviews, replay/parser, source verification and exports | Preserved; timeline now converts offsets before labeling UTC |
| Optional VLM adapter | Adapter already committed, constructor/session support locally modified | Preserved session configuration, timeout and zero retries |
| Live connection and benchmark UI | Local/untracked live_ui.py; app.py modified | Added session/empty-selection/UI coverage |
| Vision corpus/runner | Local/untracked benchmark.py and benchmark_data: 12 sources, 48 PNG variants, 14 labels | All hashes/labels and source split checked; added non-null/per-field metrics and missing-image failure handling |
| Dependencies/CI | requirements.txt modified; .python-version and .github untracked | Included intended files for release; CI configured for Python 3.12 |
| Risk schema/engine/decay | Absent | Added risk_models.py and risk_engine.py; explicit illustrative score, exact matching, decay, MRSA dated clearance, exposure window, clamp and traceable arithmetic |
| Trap cases/scorecard | Absent | Added five selectable synthetic scenarios in Patient workspace and downloadable scorecard |
| Ledger | No cross-hospital lookup; document hashes are not a ledger | Added in-memory permission/fingerprint mock and verified fictional transfer lookup |
| Tests/docs | 61 tests passed locally; docs inconsistent | 95 tests pass; README/validation/handoff/deployment/demo updated |
| Live inference/deployment | No measured report or verified hosted URL established | Still outstanding; preparation and acceptance steps documented |

Pre-existing tracked modifications were exactly app.py, requirements.txt and resistlens/extraction.py. Untracked product files were .github/, .python-version, AGENT_CONTEXT.md, benchmark_data/, resistlens/benchmark.py and resistlens/live_ui.py. Finder .DS_Store files were left on disk and ignored, not staged. No key or real patient data was used.

## Documentation corrections and design decisions

- The longer AGENT_CONTEXT contains a newer 100-line checkpoint above the earlier context. Its warning that benchmark work is uncommitted was accurate at arrival. Historic statuses are now explicitly superseded by the new checkpoint.
- “Phase 1 complete” is too strong: code existed, but real VLM results, targeted new-feature checks and deployment were not established. Passing old tests does not validate live accuracy.
- README's five screens, environment-only UI key setup, optional core SDK and bounded-retry wording were stale. Actual navigation has eight destinations; UI keys are session-only; SDK is a core dependency; retries are zero.
- VALIDATION's 60/61 counts and five-screen claim were historical. Fresh tests are authoritative.
- The plan's “15 roster cases” confuses 15 documents with six patients. No independently authored 15-patient risk corpus was attached or found. Five new trap UI scenarios and parameterized unit tests are not that corpus.
- The stated formula is additive, not Bayesian. Resistance and treatment failure are not interchangeable quantities. No fitted coefficients, calibration or clinical evidence support a patient probability claim. The UI reports score points, explicitly synthetic.
- The plan gives conflicting MRSA categories and leaves drug relevance, culture organism matching, baseline context, exposure overlap and double-counting underspecified. Implementation requires explicit categories/relevant drugs/classes, exact organism/unit/context matching, latest matching evidence, timezone-aware dates, and no future contributions. Exposure is suppressed when the selected resistant culture follows its start. This is a documented demo rule, not established causal inference.
- Missing baseline uses the requested 0.15 fallback with a visible BASELINE_UNAVAILABLE flag. Not ordered and unknown testing are separate. Multiple quality flags can coexist. MRSA persistent weight is not falsely labeled as reduced due to age.
- Separate strict risk contracts avoid silently changing the VLM ClinicalEvent schema and invalidating the existing labels. Consequently, VLM-to-risk ingestion is not implemented; scorecard sources are visibly authored fixtures, not extracted patient history. New culture records contain specimen, but ClinicalEvent specimen/susceptibility-presence fields remain absent.
- The mock uses opaque fictional tokens and canonical payload hashing; it does not hash SSNs, query hospitals, implement Fabric, provide authenticated identity, encrypt transport or establish HIPAA/GDPR compliance. Tamper detection assumes the stored reference digest remains trusted.
- Source quotes/dates are exposed for the risk score, but they are authored fixture provenance. No fabricated model confidence or calibration is attached.

## Prioritized remaining plan

| Priority | Next step | Acceptance evidence |
|---|---|---|
| P0 | Complete release push and inspect Python 3.12 CI | Intended revision on private remote; checks green |
| P0 | Run live VLM development smoke test using a session-configured key/model | Saved actual report, model, count, failure/non-null metrics and manually inspected quotes |
| P0 | Deploy and rehearse on another device | Actual hosted URL, exact deployed revision, download/error/session-isolation checks |
| P1 | Freeze extraction contract and evaluate held-out sources | Separate development/test results; no tuning on held-out results |
| P1 | Author an independent 15-case risk matrix with manual expected arithmetic | Cases cover relevant/unrelated data, missing baseline, dates/clearance, S/I/R, transfer errors and exposure boundaries |
| P1 | Version a risk-ingestion contract across adapters, fixtures, verification, UI and evaluation | Source-verified extracted risk records reach the same score shown in a true end-to-end test |
| P2 | Improve decorative benchmark font glyphs in a versioned corpus | New manifest/version, unchanged label truth, all-image visual review |
| Defer | Real Fabric/EHR, real data, clinical prediction claims, training and production storage | Separate scoped project with evidence and appropriate governance |
