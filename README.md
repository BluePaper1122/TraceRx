# TraceRx

TraceRx is a hackathon prototype for reviewing whether new lab evidence has a documented review linked to an active antimicrobial order. It uses invented cases to demonstrate event validation, source verification, and time-dependent workflow rules.

Project deployments: [resistlens.onrender.com](https://resistlens.onrender.com/) · [antibiotic-resistance-tool.onrender.com](https://antibiotic-resistance-tool.onrender.com/)

## Run locally

Use Python 3.11 or newer:

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m streamlit run app.py
```

On Windows, activate with `.venv\Scripts\activate`. On a Mac, `Launch TraceRx.command` also starts the app and opens the browser. Keep its Terminal window open while using it.

The Streamlit demo includes six synthetic cases and works offline after dependencies are installed. Start with **Start here** for a guided walkthrough. No account or API key is needed for the offline demo.

## What to try

- Inspect an order, report, and linked review on the event timeline.
- Move the demo clock to see which evidence is available at that time.
- Verify a source and record a review linked to a particular order and report version.
- Load an amended report: a review of an earlier version does not close the new one.
- Export the current session before closing it. Session state is not a durable database.

A React frontend and FastAPI backend expose the same Python workflow. See [React setup](REACT_MIGRATION.md) for startup, deployment, and frontend checks. The root also contains earlier frontend work; follow the setup guide for the interface you want to run.

## Scope

This is a research demonstration, not a clinical decision tool. It does not diagnose, prescribe, assess treatment appropriateness, or recommend medication changes. A flag indicates that no qualifying review is documented in the available synthetic record; it does not establish that a review never happened.

The optional vision adapter returns unverified structured events that need human source checking. Offline image replay is a fixture lookup, not OCR. Live vision accuracy has not been measured. The synthetic risk score and mock ledger are demonstrations, not validated predictions or production integrations.

[Full workflow and technical reference](REFERENCE.md) · [Validation](VALIDATION.md) · [Deployment](DEPLOYMENT.md)

## Tests

```sh
python -m pip install -r requirements-dev.txt
python -m pytest -q
python -m tracerx.evaluation --output evaluation.json
```

The tests cover workflow rules, schemas, extraction boundaries, API behavior, and UI interactions. The evaluation corpus is synthetic and is not clinical validation. Optional live-model calls require a separate key and may incur charges; see the technical reference before running them.
