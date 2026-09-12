# Current execution checkpoint — 2026-09-12

This checkpoint supersedes implementation-status claims in the historical handoff below. Read RECONCILIATION.md and VALIDATION.md for the audited current state.

- Preserved and tested the existing local benchmark, live UI and adapter changes; incorporated remote README commit 5d997b9 without resetting the working tree.
- Added separate risk_models.py, risk_engine.py, risk_ui.py and in-memory ledger.py. The original ClinicalEvent schema and workflow rules remain unchanged. The score is explicitly illustrative, not a clinical probability. Risk UI fixtures are separate from extracted documents.
- Added non-null/per-field benchmark metrics and sanitized missing-image/checksum/extraction failures; corrected UTC timeline conversion.
- Fresh local verification: 95 tests passed; six workflow scenarios, 165 parser fields and 15 exact documents passed. Real VLM calls, hosted deployment, clinical validation and an independent 15-patient risk corpus remain outstanding.
- README now documents eight navigation destinations and session credentials. DEPLOYMENT.md supplies the cloud configuration and smoke checks. No new deployed URL has been observed.
- Historical material below is preserved as requested; do not treat its old uncommitted inventory, test counts or absent-feature claims as current.

---

# ResistLens — agent context

## Current handoff checkpoint — 2026-09-12

Read this checkpoint first, then the detailed sections below. The pre-existing context has been preserved. This checkpoint records the latest conversation and directly inspected working-tree state; it does not imply that unfinished changes were deployed.

### User, goals, and communication

- Address the user as **Yiyi**. She has VLM/healthcare domain experience but needs clear, concrete computer instructions. Explain which application, page, button, or folder to open; do not assume that opening app.py on GitHub runs the app.
- The team is building ResistLens for HackRice and wants a substantial, polished Python-first project with a dependable offline fallback. The user explicitly wants to advance beyond the simulated walkthrough to real VLM extraction and evaluation, and wants free remote hosting so the app does not depend on her computer.
- The latest request is to save detailed project knowledge for another agent. The preceding unfinished request was to implement the live-VLM milestone, generate blurred/varied test data, and publish the app. Preserve that outstanding objective when the user resumes implementation.
- Yiyi confirmed she **has an OpenAI API key**. No key was supplied to the agent. Never ask her to paste it into chat or record credentials in this document.
- Yiyi explicitly approved creating and pushing source to the private GitHub repository **BluePaper1122/resistlens**. That repository was created successfully. Her latest hosting request authorizes working toward a publicly reachable app, but the source repository remains private; changing repository visibility is not necessary or already done.

### Exact directories and repository state

Project root:

```text
/Users/ysun26/Documents/Codex/2026-09-11/referenced-chatgpt-conversation-this-is-an/outputs/resistlens
```

Parent task workspace:

```text
/Users/ysun26/Documents/Codex/2026-09-11/referenced-chatgpt-conversation-this-is-an
```

- `outputs/resistlens` is its own Git repository, on `main`.
- Remote: https://github.com/BluePaper1122/resistlens.git
- Last locally observed commit: `d475ee1` — Add guided first-use walkthrough and Mac launcher. It was successfully pushed in an earlier turn.
- Earlier commits: `f8fdd70` — Preserve independent findings and require fresh source verification; `03ac3b5` — Initial ResistLens project.
- The live-VLM/benchmark additions are **not committed at this checkpoint**. Modified tracked files: `app.py`, `requirements.txt`, `resistlens/extraction.py`. Untracked feature files/directories: `.github/`, `.python-version`, `benchmark_data/`, `resistlens/benchmark.py`, `resistlens/live_ui.py`. This context file is also untracked. Inspect Git again before acting because the user or another agent may make changes.
- `.DS_Store` and `resistlens/.DS_Store` are also untracked. Do not blindly stage them; exclude these Finder metadata files when packaging or committing.
- Both the project `.venv/` and task `work/venv/` exist. The tests below used the latter. No need to reinstall dependencies merely to reproduce that run.
- The sibling `outputs/resistlens.zip` is an older delivery archive. It was last refreshed before the live-VLM additions; regenerate it only after completing and checking the new features. `synthetic-documents.zip` inside the repository is the original 15-document fixture pack, not the new 48-image benchmark.

### Verified now versus pending

Fresh verification during this documentation request:

```text
Working directory: outputs/resistlens
Command: ../../work/venv/bin/python -m pytest -q
Result: 61 passed in 4.12s
```

This is a real current run of the existing suite. It is not evidence that the new benchmark scoring, all new UI branches, hosted deployment, or actual API responses have been exercised. No additional tests were added during this documentation request.

Verified earlier: private GitHub publication, local app health response, the original full workflow, the guided walkthrough, and source-based/fake-client adapter tests. The current source implements the new features described below, but those features need targeted tests before release.

**Not verified or completed:** real VLM inference, measured live vision accuracy, model training/fine-tuning, cloud deployment, hosted multi-user isolation, external dataset ingestion, durable storage, clinical validation, and end-to-end extraction-to-workflow benchmark accuracy. Do not claim any of these based on code presence or the 61-test count.

### New local work that must be preserved

1. **`resistlens/benchmark.py`:** generates 48 PNGs from 12 fictional source records with three layout families. Each source has clean, Gaussian-blurred, low-resolution, and rotated/low-contrast variants. Source IDs B01–B06 are development; B07–B12 are test. All variants of one source stay in its split. This avoids variant leakage but is not independently curated data. Labels cover 14 event fields. A timestamp-absent source tests null handling.
2. **`benchmark_data/`:** generation completed successfully. Contains `images/`, `manifest.json` with labels/splits/hashes, and `DATASET_CARD.md` describing provenance, transforms and limitations. No real patient records or external datasets were used. These files are evaluation data, not a model-training claim.
3. **Live benchmark runner:** actual calls through OpenAIAdapter, per-field comparisons, exact-document match, incorrectly populated nulls, failures, timings, and condition breakdowns. Failed calls count as incorrect fields. Labels are not passed to the adapter. The CLI defaults to three development images; the UI defaults to one selected image. No real-run result has been produced by this agent.
4. **`resistlens/live_ui.py`:** AI connection page with a password field, model ID, session-only save/forget actions; Vision benchmark page with previews, labels, download ZIP, explicit billable-call confirmation, run button and result export. Credentials are intentionally excluded from project/session export artifacts. They are still held on the Streamlit server in session memory, so use a trusted local/HTTPS deployment.
5. **`OpenAIAdapter`:** now accepts explicit `api_key` and `model` constructor arguments, with environment fallback for CLI callers. Timeout is 45 seconds and SDK retries are zero. The public UI requires a session credential rather than automatically spending a server-wide key. No model ID is hard-coded.
6. **Document studio import:** can create a new synthetic patient/encounter after source verification. An existing patient with a different encounter is rejected because findings are currently keyed by patient ID; it is not silently merged. This new branch needs dedicated testing.
7. **Dependency/deployment preparation:** OpenAI SDK is now in core `requirements.txt`; `.python-version` says 3.12; `.github/workflows/tests.yml` proposes a Python 3.12 Ubuntu test job. The CI file has not been pushed or observed running. A version file does not guarantee the hosting provider selects that runtime: check deployment settings.

### Pending user interactions and hosting work

Two browser tabs were opened in the Codex in-app browser:

- Local ResistLens: `http://127.0.0.1:8501/`. The agent selected **AI connection**, where Yiyi can enter her key and accessible model ID and click **Save connection for this session**. Saving alone sends no inference request. Subsequent browser inspection should avoid reading or exposing credentials. Tab identifiers are session-specific; rediscover them rather than assuming old handles remain valid.
- Streamlit Community Cloud: `https://share.streamlit.io/`. It showed **Continue to sign-in**, with text stating that signing in agrees to Terms of Service. The agent did not accept those terms or complete sign-in.

An asynchronous question asked Yiyi to complete Streamlit sign-in herself and report when done. No completion reply was observed before this checkpoint. Browser policy required action-time approval for accepting new terms; the agent chose to hand that user action back. This is an external sign-in prerequisite, not an application error.

Streamlit Community Cloud was selected because official documentation describes free hosting of Streamlit apps from GitHub, including private repositories. No hosted URL exists yet. Do not mistake localhost, GitHub source publication, or the Streamlit sign-in page for a deployment.

The Sites hosting skill was inspected, but its documented build targets are Workers/static assets, not this existing Streamlit server. No Site was registered, no Sites project ID exists, and no `.openai/hosting.json` was created. Do not rewrite the app into an unrelated static mock just to produce a public link.

Useful official references:

- https://docs.streamlit.io/deploy/streamlit-community-cloud
- https://docs.streamlit.io/deploy/streamlit-community-cloud/deploy-your-app/deploy
- https://docs.streamlit.io/deploy/streamlit-community-cloud/share-your-app
- https://platform.openai.com/docs/guides/structured-outputs

Hosting can be free while inference incurs provider charges. Report that distinction plainly. Preserve the private source repository unless Yiyi explicitly requests a visibility change. Once sign-in and access are available, use repository `BluePaper1122/resistlens`, branch `main`, entry point `app.py`; verify the exact deployed app and access audience before claiming publication.

### Recommended continuation sequence

1. Inspect Git status and preserve the current uncommitted work. Read new benchmark/live UI code and add targeted tests for label scoring, failed-call denominators, split isolation, hash validation, session credential handling, empty selections, and new-patient import/encounter rejection.
2. Visually inspect clean and degraded dataset samples for readability, clipping and correct ground truth. Do not regenerate source labels from model outputs. Add per-field/non-null metrics if needed so irrelevant nulls do not inflate the headline score.
3. Confirm Yiyi has saved a connection without reading the key. Run a small approved real call, inspect schema and source accuracy, then evaluate development documents. Use test data only after prompt/schema decisions are frozen; disclose sample counts and failed requests.
4. Update stale README/VALIDATION claims, commit only intended files and push to the already approved private repository after tests pass. Avoid sweeping up Finder metadata, credentials or unrelated agent edits.
5. Once Yiyi completes hosting sign-in, deploy the tested revision. Verify public reachability, actual document extraction with session credentials, no cross-session data/key sharing, error paths, and download behavior. Report any remaining account authorization blocker explicitly.
6. Deliver actual results and the exact hosted URL only when observed. If live calls cannot run, deliver the dataset and implementation but explicitly leave model accuracy unmeasured.

### Cautions about the older context below

The pre-existing document includes proposed clinical fields and possible schema evolution. In this conversation, adding `specimen` or `susceptibility_testing_present` was not part of the latest requested milestone. Treat those passages as planning context, not a new instruction to extend the schema without considering scope. Likewise, any historic “planned priorities” must be reconciled with Yiyi's current live-VLM, dataset, hosting and handoff requests.

The app's timeline currently formats stored timestamps with a literal UTC label without explicit timezone conversion; assess this before importing non-UTC sources. The benchmark uses UTC examples and does not establish correct display of arbitrary offsets. This is an inspection concern, not a fixed behavior.

---

Last inspected: 2026-09-12. This document describes the working directory, including uncommitted additions, rather than only the Git commit. It is a handoff for coding agents, not a clinical protocol.

## 1. Purpose, audience, and HackRice positioning

**Close the evidence-to-review gap.** ResistLens is a synthetic antimicrobial-stewardship workflow demonstration. Its question is: **When new final microbiology evidence arrives after an active antimicrobial order, is a review of that exact evidence and order documented in the available record?**

The intended users are stewardship pharmacists, clinicians, and hospital quality/operations teams who need visibility into information-continuity gaps across reports, orders, and review documentation. These are intended personas; no actual hospital adoption or user study is established by this repository. Missing review documentation does not prove a clinician failed to review something, because the available record may be incomplete.

The HackRice pitch combines an understandable healthcare workflow problem, visible image-to-structured-data AI, deterministic and explainable temporal rules, provenance, a polished demonstration, and measurable software behavior. This is a positioning strategy, not a promise of winning or verified claims about current judging criteria. Earlier discussion considered computational-biology/ChimeraX ideas but selected ResistLens for a team with VLM/domain experience and limited software-development experience. Keep the system understandable and Python-first while delivering a complete, polished experience; do not shrink it to a bare shell in the name of reliability.

AMR is the motivation, not a measured outcome. The repository does not demonstrate reduced resistance, improved treatment, reduced mortality, prescribing quality, or avoided clinical harm.

## 2. Status labels and evidence hierarchy

- **Implemented:** visible in inspected source, fixtures, configuration, or UI. This does not by itself mean validated clinically or tested with a real provider.
- **Planned/optional:** an intended addition, or an existing optional path requiring configuration. Say explicitly which applies.
- **Future idea:** exploratory scope with no implementation commitment.

Prefer source and reproducible checks over old narrative descriptions. The reference conversation is design history, not proof of implementation. In particular, its earlier claim that a Work session would build features was a brief, not evidence of delivery. The retrieved explanation of laboratory fields is truncated; do not invent the missing conversation text.

### Implemented inventory

Eight Streamlit navigation destinations: Start here, Overview, Patient workspace, Document studio, Evaluation lab, AI connection, Vision benchmark, About & demo. Six synthetic longitudinal cases; a separate isolated guided walkthrough; simulated clock; deterministic pair evaluation; field evidence and human verification; editable extraction JSON; explicit event replacement; source-linked review entry; session activity and exports; fixture-image replay; labeled-text parsing; optional live OpenAI adapter; local evaluation; a 48-image synthetic vision benchmark and real-call runner; FHIR/RxNorm protocols only.

### Important gaps

No PDF ingestion, general offline OCR, real patient support, diagnosis, drug recommendation, susceptibility interpretation, hospital connection, durable database, authenticated multi-user workflow, immutable audit trail, background polling, or deployment validation. No standalone ARCHITECTURE.md exists; architecture is documented in README.md and this file. `specimen` and `susceptibility_testing_present` are **not** current model fields. The conceptual names `result_status` and `organism_or_result` map to current `report_status` and `result`.

## 3. Why AI and deterministic rules have separate jobs

Conceptually, screenshots, photographed reports, medication screens, and eventually PDFs contain facts in inconsistent visual layouts. A multimodal model can transform such artifacts into strict structured events with source quotes. Currently, the image path accepts PNG/JPEG and extracts exactly one supported synthetic event; PDFs and arbitrary real clinical documents are outside scope.

Implemented flow:

```text
Synthetic image or labeled text
  -> DemoAdapter / TextAdapter / OpenAIAdapter
  -> ClinicalEvent inside Document, initially unverified for extracted uploads
  -> schema validation, field evidence, source inspection and human confirmation
  -> Case matched by patient and encounter
  -> deterministic engine.evaluate(case, as_of)
  -> findings, queue, timeline, evidence, linked review
  -> session audit and downloadable exports
```

AI extracts facts; it never decides prescribing or whether a flag should fire. Temporal matching is ordinary deterministic Python: inspectable, reproducible, independently testable, and unaffected by model wording. Schema-valid JSON is not evidence that extracted facts are correct. The model prompt treats source text as untrusted data and forbids inferred times, identities, clinical significance, or review linkage.

## 4. Clinical/document semantics to preserve

| Concept | Exact meaning and cautions | Current implementation |
|---|---|---|
| `specimen` | Biological material tested, such as blood, urine, sputum, tissue, or cerebrospinal fluid. It identifies the sample, not a diagnosis or automatic infection site. Missing specimen stays unknown. | Proposed field; absent today. |
| `result_status` | Laboratory reporting lifecycle. **Preliminary** means partial findings or work still in progress; identification/testing may continue. **Final** means the lab finalized that reported result, subject to correction/amendment. Final does not establish a definitive patient diagnosis or imply a medication change. It does not guarantee susceptibility data exist. | Named `report_status`; allowed values preliminary, final, amended, unknown, or null. |
| Amended status | A later changed report needs a distinct version identity. A review of an earlier version cannot automatically cover it. Do not map every external correction/cancellation into amended without explicit mapping rules. | `amended` participates in the same trigger as final, using a distinct `report_id`. |
| `organism_or_result` | What the source actually reports: an organism label, no growth, target detected/not detected, mixed findings, etc. Preserve source wording; do not turn a reported organism into a diagnosis or infer clinical significance, contamination, or resistance. | Named `result`, a nullable string. Fixtures use invented labels. |
| `susceptibility_testing_present` | Whether the document explicitly contains susceptibility-testing information. Presence alone says nothing about whether a specific drug is effective, whether an organism is susceptible/resistant, or whether treatment should change. A detected table/section is not equivalent to final completed testing. | Proposed nullable boolean; absent today. Use true for explicit present information, false only for explicit evidence of absence, null when unknown/unreadable/not ascertainable. If pending testing matters, add a separate status rather than overloading this boolean. |
| Field extraction confidence | Confidence attached to one extracted field, not patient risk, diagnostic certainty, drug efficacy, or probability of a safe outcome. A value such as 0.94 is a reported extraction score, not an established 94% accuracy rate. | `Evidence.confidence` in [0,1]. AI scores are self-reported and uncalibrated; authored fixtures/text parsing use 1.0. |
| Provenance/source evidence | Trace a field to an original document, verbatim quote and page, and trace a finding to contributing documents. Source identity, extraction origin, and verification are separate concepts. | `Evidence(field, quote, page, confidence)`, Document identifiers/hash/origin/verified, Finding.evidence_ids. No bounding boxes or automatic visual quote verification. |

`occurred_at` is event-specific: order start, report publication, or documented review time. Do not substitute specimen collection time for publication time. All supplied timestamps require explicit timezone offsets; absent/unreadable values stay null. `order_end` is exclusive. `report_id` is a report **version** identifier, not just a stable laboratory accession. `event_id` and `document_id` serve separate record/source identities. The current schema uses null for irrelevant fields too; do not confuse that with a supported negative finding.

## 5. Current contracts and recommended schema evolution

`models.py` uses Pydantic with extra fields forbidden and assignment validation. Nullable ClinicalEvent keys are still declared required keys: include them with null when appropriate. Types enforce timezone-aware datetimes, bounded confidence, known event/status/origin values, nonempty event IDs, chronological order-end validation, and no duplicate or unknown evidence-field references. Kind-specific completeness is enforced by readiness, not solely by model construction.

- ClinicalEvent: event_id, patient_id, encounter_id, kind, occurred_at, order_end, medication, report_status, result, report_id, reviewed_report_id, reviewed_order_id, reviewer, review_note, evidence.
- Document: document_id, title, text, event, verified, origin, sha256. Origins: synthetic fixture, local text parser, live AI, human review.
- Case: patient_id, encounter_id, label, unit, story, documents.
- Finding: state, report_id, order_id, reason, evidence_ids, hours_open.

A complete current-schema microbiology example, matching an authored fixture event:

```json
{
  "event_id": "DEMO-101-M1",
  "patient_id": "DEMO-101",
  "encounter_id": "ENC-DEMO-101",
  "kind": "microbiology",
  "occurred_at": "2026-09-11T10:00:00+00:00",
  "order_end": null,
  "medication": null,
  "report_status": "final",
  "result": "Synthetic organism label X; training example only",
  "report_id": "DEMO-101-R1",
  "reviewed_report_id": null,
  "reviewed_order_id": null,
  "reviewer": null,
  "review_note": null,
  "evidence": [
    {
      "field": "event_id",
      "quote": "event_id: DEMO-101-M1",
      "page": 1,
      "confidence": 1.0
    },
    {
      "field": "patient_id",
      "quote": "patient_id: DEMO-101",
      "page": 1,
      "confidence": 1.0
    },
    {
      "field": "encounter_id",
      "quote": "encounter_id: ENC-DEMO-101",
      "page": 1,
      "confidence": 1.0
    },
    {
      "field": "kind",
      "quote": "kind: microbiology",
      "page": 1,
      "confidence": 1.0
    },
    {
      "field": "occurred_at",
      "quote": "occurred_at: 2026-09-11T10:00:00+00:00",
      "page": 1,
      "confidence": 1.0
    },
    {
      "field": "report_status",
      "quote": "report_status: final",
      "page": 1,
      "confidence": 1.0
    },
    {
      "field": "result",
      "quote": "result: Synthetic organism label X; training example only",
      "page": 1,
      "confidence": 1.0
    },
    {
      "field": "report_id",
      "quote": "report_id: DEMO-101-R1",
      "page": 1,
      "confidence": 1.0
    }
  ]
}
```

This is an event, not a whole Document. Wrapping it requires the real source text/hash and explicit verification state; never fabricate a hash or mark a live extraction verified automatically.

**Planned schema extension, not accepted by the current strict model:**

```json
{
  "specimen": "blood",
  "result_status": "final",
  "organism_or_result": "Synthetic organism label X; training example only",
  "susceptibility_testing_present": true
}
```

This fragment illustrates proposed names/semantics only, not an importable payload or existing fixture fact. Add provenance for each new field, preserve raw source text, and decide whether to retain current names or introduce a versioned migration. Update models, prompts, parser, fixtures, UI, benchmark labels, exports, and tests together. Do not silently rename `report_status` or `result`. Specimen/susceptibility presence should initially be descriptive fields, not new treatment logic. Future richer event envelopes could separate collection/publication times, source version lineage, extraction metadata, and verification records; none are implemented as dedicated models today.

## 6. Readiness and provenance gates

Required fields are event_id/kind plus patient_id, encounter_id, occurred_at and event-specific facts: medication for orders; report_status/report_id/result for microbiology; both reviewed IDs, reviewer and review_note for reviews. A supplied order_end also requires evidence.

Readiness score is rounded `100 × required-field coverage × minimum reported confidence among required fields with evidence`. Coverage counts nonmissing, supported required fields. The score is a heuristic, not calibrated accuracy. Eligibility separately requires no missing values/support, known report status, minimum confidence >= 0.80 and human verification. The engine also checks matching patient/encounter and duplicate IDs. A high score alone does not establish eligibility.

For text, quotes must occur literally in the source. For labeled quotes, values must agree with the field; timestamps are compared as datetimes. Images require human visual checking of quotes and interpretation. A hash identifies bytes, not truth or tamper-proof audit. Fixture hashes initially refer to authored text; replay/live image documents use uploaded-image hashes. Uploaded source bytes are retained in session memory and included in evidence ZIP exports. Live image Document.text is empty. Corrections and re-extractions require fresh confirmation; human checking does not raise confidence scores.

## 7. Deterministic rule v1.0 and comparison cases

At evaluation time T, only known events with occurred_at <= T are considered; unknown times generate verification findings. Known future records are excluded even from duplicate/quality warnings, although displayed in the timeline. Duplicate visible event IDs or report-version IDs yield verification findings for affected records; unrelated evidence remains evaluable.

For each accepted final/amended report R and accepted order O:

1. O.start < R.publication, strictly. Simultaneous timestamps do not trigger.
2. O is active at T: O.end is absent, or T < O.end.
3. A qualifying accepted review must reference both O.event_id and R.report_id and have R.publication <= review.time <= T.
4. Such a review produces Reviewed; otherwise the pair produces Needs review.

All fixture medication orders are explicitly authored as antimicrobial orders. No drug-name classifier, organism lookup, susceptibility rule, or clinical urgency target affects the decision. Generic review notes without exact links cannot close a pair. An amendment uses a new report version. Ending an order removes its active trigger at that time; the app does not separately track historical unresolved quality events.

When there are no findings, the engine emits No trigger. Case summary precedence is Needs verification, Needs review, Reviewed, No trigger. Multiple pair findings remain visible; a summary is not the entire case. `hours_open` measures report age, not overdue care or severity. Overview counts for awaiting review/verification can overlap; its average readiness includes case documents and is not the same as engine eligibility at the selected time.

Default clock: 2026-09-11 18:00 UTC (slider 36 hours after Sep 10 06:00 UTC).

| Case | Authored situation | Expected summary |
|---|---|---|
| DEMO-101 | Active order Sep 10 08:00; final report Sep 11 10:00; no linked review | Needs review |
| DEMO-102 | Same pattern, exact linked review at 11:00 | Reviewed |
| DEMO-103 | Preliminary report only | No trigger |
| DEMO-104 | Order ended Sep 11 08:00 before report | No trigger |
| DEMO-105 | Unreadable publication time, unverified report | Needs verification |
| DEMO-106 | Original reviewed at 11:00; new amended version at 14:00 | Needs review |

“Safe comparison” in planning language means a **nonflagged workflow comparison**, preferably DEMO-102. Never label it clinically safe. Reviewed means qualifying documentation exists; No trigger means this specific rule has no eligible pair. Neither establishes appropriate treatment, absence of infection, or absence of harm.

## 8. Actual UI and demonstration flow

Start here is a four-step walkthrough using the real engine on an isolated copy of DEMO-101. Its clock is independent of the sidebar and its simulated review does not change the patient workspace.

For the full artifact-to-review demonstration:

1. Start/reset the synthetic cases and select DEMO-101; use hour 27 then 28 to show the final-report arrival.
2. In Document studio, select/download/upload a bundled synthetic PNG, or use labeled text. Original sample records already exist: importing the same event requires explicit replacement, not duplication.
3. Choose extraction mode. Disclose fixture replay as replay. Real VLM extraction requires AI connection configuration and synthetic-image transmission confirmation.
4. Inspect the displayed source, JSON, field quotes, confidence and IDs. Correct fields and corresponding quotes together. Confirm source inspection and import to the matching patient/encounter.
5. Return to the timeline and review finding; show Evidence & reasoning and contributing sources.
6. Document a review with a reviewer, note and confirmation. It links the selected exact pair at the simulated clock time and re-evaluates the queue without changing medication.
7. Compare DEMO-102 (Reviewed), DEMO-103/104 (No trigger), DEMO-105 (uncertainty) and DEMO-106 (new amendment).
8. Finish with Evaluation lab, optional Vision benchmark, and export.

Import can create a new synthetic case. The current workspace rejects a second encounter for an existing patient rather than merging encounters. There is no batch upload workflow. Review entries and event replacements are session-local; export before reset/close.

## 9. Batch/admin concept versus implementation

Implemented Overview evaluates all in-memory cases, shows case/review/verification/reviewed counts, filters by state and unit, lists open pairs and average readiness, and exports queue CSV. It also exposes session activity, complete session JSON, and an evidence ZIP containing retained source images. Replacement audit records include before/after data. Credentials are excluded from these export bundles.

This is the admin-dashboard concept realized as a single-session work queue, not a hospital administrator system or shared service. Assignment, role-based access, persistence, escalation policies, background ingestion and operational analytics are future work. Do not describe elapsed evidence age as a clinically validated deadline.

## 10. Evaluation and what metrics mean

`evaluation.py` evaluates six authored scenario states at the fixed demo clock and parses 15 authored labeled-text documents. It compares 11 selected fields per document (165 comparisons). Metrics: rule scenario accuracy, field exact accuracy, and document exact match over those selected fields. It does not score every schema field or verify quote correctness. Errors receive zero matching fields. Session edits do not modify ground truth. The CLI returns nonzero on regression mismatch. `--live` substitutes real image extraction for text parsing, but rule checks still use authored cases rather than the extracted predictions: this is not end-to-end live workflow accuracy.

`benchmark.py` and benchmark_data contain 12 fictional source records × four image conditions = 48 PNGs, three layout families, and 14 scored fields. Conditions: clean, blur, low resolution, rotated/low contrast. B01–B06 are development; B07–B12 are test; all variants of one source stay together. Layout families overlap splits. This is an authored source-held-out split, not an independent hospital benchmark, and the records are not longitudinal episodes.

The live benchmark checks file hashes, reports field accuracy, document exact match, failures, incorrectly populated null fields, condition breakdowns and per-document elapsed seconds. Failed calls count as incorrect fields. Quotes require separate human inspection. Null-heavy fields can inflate aggregate accuracy. Keep test sources untouched during tuning, compare all four variants for degradation studies, and report sample counts and model ID. There is no trained/fine-tuned model here and no evidence of provider training-set composition.

**Additional planned metrics:** per-field precision/recall, flag false positives/negatives on a broader independently authored scenario set, abstention/verification rate, quote faithfulness, measured confidence calibration, cost and latency summaries, end-to-end extraction-to-finding accuracy. These are not current measured results.

Existing VALIDATION.md records 61 passing tests and perfect local regression counts, but a follow-up paragraph says 60 tests. These are historical, internally inconsistent counts; use a fresh run as authority. No saved real-provider benchmark result was found in the inspected root inventory, and existing validation explicitly says no real API call was made during that delivery. Do not claim live accuracy from adapter presence, fake-client tests, fixture replay, or parser scores.

## 11. Repository map (observed files)

```text
resistlens/                         repository root (folder itself)
├── app.py                        Streamlit UI, navigation, session imports/reviews/exports
├── resistlens/                   Python package
│   ├── __init__.py
│   ├── models.py                 contracts, provenance, readiness
│   ├── engine.py                 independent deterministic rule v1.0
│   ├── fixtures.py               six cases, text sources, PNG renderer
│   ├── extraction.py             image validation and three adapters
│   ├── evaluation.py             local/optional live regression CLI
│   ├── benchmark.py              48-image generation, scoring and live CLI
│   ├── live_ui.py                session AI credentials and benchmark screen
│   └── integrations.py           FHIR/RxNorm protocols, not connectors
├── tests/
│   ├── test_engine.py
│   ├── test_extraction.py
│   └── test_app.py                Streamlit AppTest coverage
├── benchmark_data/
│   ├── DATASET_CARD.md
│   ├── manifest.json
│   └── images/                   48 checked-in/generated PNGs
├── README.md
├── DEMO_SCRIPT.md
├── VALIDATION.md
├── AGENT_CONTEXT.md              this handoff
├── evaluation.json               existing saved regression output
├── synthetic-documents.zip       existing source pack
├── Launch ResistLens.command     Mac launcher
├── requirements.txt              current core dependencies, including OpenAI SDK
├── requirements-ai.txt           auxiliary AI install entry
├── requirements-dev.txt          pytest and core dependencies
├── requirements-tested.txt       recorded environment versions, not universal lock
├── .env.example                  variable names; not automatically loaded
├── .python-version
├── .streamlit/config.toml
├── .github/workflows/tests.yml
└── .gitignore
```

Also present: .git, .venv, .pytest_cache and generated Python caches; these are not product features. At inspection, app.py, requirements.txt and extraction.py had existing modifications, and .github, .python-version, benchmark_data, benchmark.py and live_ui.py were untracked. Preserve them. Do not reset or overwrite them based on an older commit.

Documentation drift: README says five workspaces, while app.py has eight destinations. README's environment-only UI setup is superseded by `live_ui.live_adapter()` requiring session credentials. README describes bounded retries, but extraction.py explicitly sets `max_retries=0` and timeout=45. OpenAI is already listed in current requirements.txt despite older optional-install wording. Use source behavior as authority and reconcile documentation when changing those areas.

## 12. Run, fallback, and live behavior

Python-first stack: Streamlit, Pydantic, Pillow, pandas and the OpenAI SDK. README recommends Python >=3.11 and records testing on 3.14. Run from the repository root:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m streamlit run app.py
```

The Mac launcher provides a double-click entry point. Existing environments may be reused; do not recreate a working environment unnecessarily.

Without keys, the guided demo, dashboard, timeline, review actions, local extraction, exports, dataset previews/downloads and parser evaluation work offline after dependencies are installed. DemoAdapter recognizes an unchanged bundled PNG by SHA-256 and returns authored data with verified=false. It is not OCR. Unknown images fail explicitly; PNG rendering/hash compatibility may vary by Pillow version. TextAdapter only parses the labeled synthetic training format. Neither proves VLM ability.

For the actual UI, save your own key and accessible compatible model in AI connection, then confirm synthetic-image transmission in Document studio or Vision benchmark. Saving a connection does not test it. Keys live in Streamlit session memory on the app server, with a Forget action; no host-wide credential is exposed through the UI adapter. CLI OpenAIAdapter can instead read OPENAI_API_KEY and OPENAI_MODEL. No automatic .env load or built-in default model exists.

Live extraction validates nonempty PNG/JPEG input <=8 MB and <=16 million pixels, normalizes the image, sends one image through Responses structured parsing with ClinicalEvent, and locally revalidates the result. Calls use a 45-second timeout and zero SDK retries. Output is unverified. Sanitized failures do not silently become fabricated success or switch modes; users explicitly select offline replay. `store=False` is not a claim about all provider retention. All data remain synthetic regardless of configuration.

Verification commands:

```bash
python -m pytest -q
python -m resistlens.evaluation
# Optional real API calls; configure account/model first:
python -m resistlens.evaluation --live --output live-evaluation.json
python -m resistlens.benchmark --live --split development --limit 3 --output benchmark-result.json
```

The benchmark CLI's exit status reports extraction failures, not a requirement for perfect accuracy; inspect the metrics. No live call is necessary for this documentation handoff.

## 13. Safety language and non-goals

Use this language in the product and pitch:

> Research demonstration only. All cases and documents are invented. ResistLens identifies potential review-documentation gaps in the available synthetic record. It does not diagnose, prescribe, recommend antibiotics, recommend or automate medication changes, determine resistance, assess treatment appropriateness, or provide treatment advice. Reviewed and No trigger are workflow states, not clinical safety judgments. A flag does not prove that no review occurred outside the available record.

Only invented records are supported. Do not upload actual patient records, enable a real clinical workflow, claim compliance/certification, or describe a demo source-verification checkbox as clinical authorization. Do not infer susceptible/resistant categories or use susceptibility presence as a drug recommendation. Do not create default clinical deadlines. Missing data must remain visible rather than silently cleared. Keep secrets out of code, logs, exports and Git. The app has no durable storage, authentication or production governance; deployment configuration files alone do not establish production readiness.

## 14. Coding philosophy and extension priorities

The team is not tech-heavy. Prefer small readable Python modules, clear labels, actionable errors, simple setup, dependable offline rehearsals and rich but understandable UI. Preserve separation of extraction, validation, workflow rules and presentation. Avoid unnecessary microservices, queues, databases, frontend rewrites or cloud infrastructure. Robustness should support a polished feature-complete demo, not excuse removing its core story.

**Near-term planned priorities:** reconcile stale docs; preserve the current guided/full demo; add explicitly requested descriptive specimen/susceptibility fields with versioned schema changes; strengthen extraction-quality/error reporting and benchmark coverage; inspect timezone rendering for non-UTC inputs before claiming full display normalization (the timeline formats stored datetimes with a literal UTC label); keep failure/verification behavior visible.

**Optional implemented seams:** FHIRSource.fetch_synthetic_case and RxNormResolver.lookup are Protocol declarations. A future FHIR implementation could map MedicationRequest, DiagnosticReport and review provenance with version/encounter/status/time validation. RxNorm could return candidate identifiers for human confirmation, never drug advice. Neither is required for demo reliability, and neither currently makes network calls or provides mappings.

**Future ideas:** PDF/multipage ingestion with exact page provenance; bounding-box highlights; longitudinal version lineage; source completeness indicators; richer independent synthetic cases; calibrated extraction uncertainty; bulk import; reviewer assignment; persistent exports/reload; audited storage; governed integrations. Clinical deployment would be a separate effort with appropriate access controls, security, data validation, operational ownership and domain review. Do not claim these ideas are implemented.

## 15. Three-minute pitch and rehearsal

0:00–0:25: “When final microbiology evidence arrives after an active antimicrobial order, can we see whether a review is documented? ResistLens makes that gap visible and traceable using synthetic records.” Show Overview: six cases, two awaiting review, one needing verification, one reviewed, two without a trigger.

0:25–1:00: DEMO-101 at hour 27 then 28. Explain that evidence arrival creates an exact order/report review pair, not a treatment recommendation. Show timestamps and sources.

1:00–1:35: Add a source-linked synthetic review at the normal demo clock. Show Reviewed and unchanged medication data.

1:35–2:05: Contrast an unreadable timestamp and a new amended report. Unknowns remain visible; old reviews cannot close new versions.

2:05–2:35: Show source alongside structured extraction. Explicitly call offline mode fixture replay. Show a real VLM only if configured and rehearsed; disclose which path ran. The AI structures evidence and the rule handles temporal matching.

2:35–3:00: Show evaluation with honest scope: local regression checks versus actual live extraction results. Close with “a traceable document-to-review workflow, with uncertainty visible and every flag tied to evidence.”

See DEMO_SCRIPT.md for the existing longer script and judge questions. Rehearse offline first, reset at hour 36, and export before closing. Do not cite speculative winning scores, live accuracy, resistance prevention or patient benefits as measured facts.

## 16. Future-agent checklist

- Read this file, README, models.py, engine.py and relevant source/tests; inspect Git status and applicable AGENTS.md before edits.
- Verify working-tree reality; distinguish implemented code, exercised behavior, optional configuration and future ideas.
- Preserve others' existing modifications/untracked files; do not reset to a stale commit.
- Preserve publication versus collection time, explicit timezones, exclusive order ends, strict order-before-report timing, future exclusion and exact order/report-version linkage.
- Preserve uncertainty/verification precedence and evaluation of unrelated valid evidence when some records are invalid.
- Keep result lifecycle distinct from diagnosis; keep susceptibility presence distinct from interpretation; do not invent clinical capabilities.
- Keep field quotes, hashes/source bytes, unknowns and human verification; edits/re-extraction require renewed confirmation.
- Migrate schemas across adapters, UI, fixtures, exports and evaluation together; strict models reject invented keys.
- Preserve disclosed offline fallback and sanitized errors; never represent replay/parser output as live AI.
- Do not introduce real data, fabricated identifiers, credentials in exports, clinical recommendations or automatic medication changes.
- Run relevant existing tests and local evaluation for code changes; report exact run counts, environment and any failures/skips. Do not copy historical counts as fresh results.
- For live evaluation, disclose provider/model, sample size, failures and scope; avoid test-split tuning and do not claim clinical validation.
- Rehearse flagged, reviewed, preliminary, ended, missing-data and amended cases; verify the isolated walkthrough stays isolated.
- Update this context and stale documentation when behavior changes. A feature is implemented only when evidence supports that claim.
