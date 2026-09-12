# ResistLens

**Close the evidence-to-review gap.** A Python-first project: a polished, fully offline-demoable antimicrobial-stewardship workflow tool.

> Note that this is a research demonstration only. All cases and documents are invented. ResistLens does not diagnose, prescribe, recommend medication changes, determine resistance, or assess treatment appropriateness. A flag means no qualifying review is documented in the available record. “Reviewed” and “No trigger” are workflow states, not clinical safety judgments.

## Start on a Mac without typing commands

Double-click `Launch ResistLens.command` in this folder. It opens the app in your default browser; keep its Terminal window open. It reuses an available project environment, or installs dependencies on first use. Start with **Start here** and follow the four guided steps. This isolated walkthrough does not modify your patient workspace.

## Run in four commands

Use Python 3.11 or newer (tested here with Python 3.14). Open a terminal in this project folder:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m streamlit run app.py
```

On Windows activate with `.venv\Scripts\activate` instead. Streamlit prints the local URL, usually http://localhost:8501. No account, API key, database, or internet is required after dependency installation. The application opens with six synthetic cases and the demo clock at **2026-09-11 18:00 UTC**.

## What is included

- Branded Streamlit interface with five workspaces and responsive native layouts.
- Multi-case work queue, state/unit filtering, counts, queue CSV and session export.
- Six synthetic scenarios: unreviewed final evidence, documented review, preliminary evidence, ended order, unreadable timestamp, and an amended report requiring a new review.
- Time simulation, ordered event timeline, exact order/report review linkage and source-linked explanations.
- Strict Pydantic contracts: rejected extra fields, timezone-aware timestamps, bounded confidence, chronological validation, nulls for unknowns.
- Field-level quote/page provenance, content hashes, transparent readiness scoring and human verification gate.
- PNG/JPEG upload, bundled training images, local labeled-text extraction, editable structured JSON and explicit replacement of existing events.
- Source-linked review documentation that immediately re-evaluates the work queue.
- An isolated optional OpenAI vision adapter with schema parsing, timeouts, bounded retries, validation and sanitized failures.
- Synthetic extraction/rule evaluation, tests for temporal edge cases, and Streamlit UI interaction tests.
- Downloadable training document pack, demo script and optional FHIR/RxNorm interface seams.

## Architecture

```text
Synthetic PNG/JPEG or labeled text
            │
  DemoAdapter / TextAdapter / OpenAIAdapter
            │
  ClinicalEvent + field quote/page/confidence
            │
  Human inspection and source verification
            │
  Case (patient + encounter + source documents)
            │
  Deterministic temporal engine ── demo clock
            │
  Findings → work queue / timeline / linked review
            │
  Session audit + JSON/CSV export + evaluation
```

`app.py` contains presentation and session interactions. `resistlens/models.py` defines contracts and readiness. `engine.py` contains the independent deterministic rule. `fixtures.py` generates training records and images. `extraction.py` owns all extraction boundaries. `evaluation.py` provides the CLI and dashboard metrics. `integrations.py` defines optional protocols only. `tests/` covers rules, extraction and UI.

## Exact workflow semantics (rule v1.0)

For each patient/encounter, consider only source-verified, sufficiently complete events available at the selected evaluation time. A pair needs review when:

1. A report is explicitly **final or amended** and its publication timestamp is strictly later than an antimicrobial order's start.
2. The order is still active at evaluation time: no end is documented, or the evaluation time is earlier than its end. The end boundary is exclusive.
3. No verified review at or after report publication explicitly references **both** that order's event ID and that report's version ID.

No organism or drug lookup affects this rule. All fixture orders are explicitly authored antimicrobial orders; the app does not classify arbitrary drugs. Report versions must have distinct IDs. A prior review cannot close an amendment with a new version ID. Generic notes and reviews before publication do not count. Future evidence is visible in the timeline but excluded from evaluation. Duplicate event identifiers or report-version identifiers, unknown timestamps, missing provenance, unknown report status and mismatched patient/encounter IDs require verification. Ending an order removes its active-pair trigger at that clock time; historical unreconciled events are not modeled as a separate quality measure.

The record is assumed to be complete only for this simulation. No detected review is not proof that no review occurred. There are no clinical time targets, prescribing rules, susceptibility interpretations or claimed patient outcomes.

## Extraction modes and confidence

**Offline fixture replay:** SHA-256 recognition of an unchanged bundled PNG returns its authored extraction. This is a transparent mock; it is not OCR and does not measure AI ability. Unknown images fail with an actionable message rather than fabricated output. Download and upload the original PNG within the same installed environment, since Pillow versions may render different bytes.

**Local synthetic text:** parses the bundled labeled-text format. Edit this format to demonstrate changes, incomplete fields and schema validation. It is deterministic parsing, not a language model.

**Live AI vision:** image → OpenAI Responses structured parsing → local Pydantic validation → unverified result. The model may hallucinate or misread fields even when its JSON is valid. The UI therefore requires human checking before a result becomes rule-eligible. Provider errors never silently change into an apparent successful AI extraction; offline mode remains available explicitly.

Readiness is `required-field source coverage × minimum reported field confidence × 100`. Required fields include event identity, kind, patient/encounter, time and event-specific values; a present order end also needs provenance. The 0.80 cutoff is an engineering demo choice, **not a clinically validated threshold**. AI confidence is self-reported and uncalibrated. Synthetic fixture confidence is authored as 1.0. Human verification is a separate gate and does not inflate confidence. Text quote presence is checked literally, and labeled quotes are checked against their field values; image quote accuracy requires visual human inspection. A valid quote alone cannot prove its semantic interpretation.

## Optional live AI setup

```bash
python -m pip install -r requirements-ai.txt
export OPENAI_API_KEY='your-key'
export OPENAI_MODEL='your-accessible-image-and-structured-output-model'
python -m streamlit run app.py
```

Select **Document studio → Live AI vision**, inspect the selected synthetic image, confirm that it is synthetic and may be sent, then click **Extract document**. The app does not automatically load `.env`; `.env.example` documents the names. Keep secrets outside Git. Choose a compatible model available to your account; no default model or availability assumption is embedded.

The adapter uses `client.responses.parse`, `text_format=ClinicalEvent`, a base64 `input_image`, and `store=False`. See the official [Structured Outputs guide](https://platform.openai.com/docs/guides/structured-outputs) and [image input guide](https://platform.openai.com/docs/guides/images-vision). These were consulted during implementation. `store=False` is a response-storage setting, not a promise about all provider retention. This project is synthetic-data-only regardless.

A real network call was not made during delivery; the adapter contract is tested using a fake client. Do not claim live vision accuracy until you run the optional live evaluation with your account.

## Tests and evaluation

```bash
python -m pip install -r requirements-dev.txt
python -m pytest -q
python -m resistlens.evaluation --output evaluation.json
```

Optional paid vision evaluation on the synthetic PNGs:

```bash
python -m resistlens.evaluation --live --output live-evaluation.json
```

The default evaluation compares local parser results with authored structured labels and compares six scenario states with explicit expectations. It reports field-level exact accuracy, document exact match and rule accuracy. It is a small regression corpus, not an independent held-out benchmark or clinical validation. Tests separately exercise timing boundaries, exact linkage, mismatches, multiple orders, unverified data, schema rejection and UI interactions. The live adapter test skips if the optional SDK is absent. CLI exits nonzero on any regression mismatch.

## Demo and troubleshooting

Read [DEMO_SCRIPT.md](DEMO_SCRIPT.md) for a three-minute walkthrough, a longer feature tour and honest answers to judging questions.

- **No API key / outage:** select Offline fixture replay and use the bundled image. Every other feature works offline.
- **Unknown uploaded image in offline mode:** expected; use a bundled sample, synthetic labeled text, or configured live extraction.
- **Missing timezone:** write an explicit offset such as `2026-09-11T10:00:00+00:00`; do not guess one.
- **Import blocked:** check required fields, quotes, confidence, human confirmation and matching synthetic patient/encounter IDs. Existing event replacement must be selected explicitly.
- **Unexpected flag after amendment:** a new report version needs its own linked review.
- **Review disappears when moving the clock backward:** expected; future review documentation is excluded.
- **Port in use:** add `--server.port 8502` to the run command.
- **Dependency installation fails:** use a fresh virtual environment and a supported Python version with access to the package index. `requirements-tested.txt` records the exact packages from the verification environment, not a universal cross-platform lockfile.

## Deliberate scope and future extensions

This is a local, single-user hackathon application. The session export includes before/after records for imported event replacements. The evidence ZIP also includes retained uploaded source images. State and audit history live in the Streamlit session and reset on session loss or server restart. Export before closing. There is no authentication, durable database, immutable audit log, background hospital polling, PDF ingestion or production deployment. Upload size is capped at 8 MB and images at 16 million pixels. Uploaded source images are kept only in session memory. HTML in source fields is escaped before timeline display.

`FHIRSource` and `RxNormResolver` are extension protocols, not working clinical connectors. A real integration would need explicit validation of source statuses, medication classification, report versions, encounter matching, timezone semantics, durable provenance and access controls. No RxNorm IDs or clinical mappings are invented here.
