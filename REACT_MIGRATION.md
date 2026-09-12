# React migration and deployment

ResistLens now has a React frontend and a same-origin FastAPI backend. The Streamlit entrypoint remains available as a deployment fallback. Both frontends use the same Python extraction, review rules, risk engine, authored risk fixtures, and mock ledger.

## Run locally

Use Python 3.12+ and Node 24 with pnpm 11.19.0.

```sh
python -m venv .venv
. .venv/bin/activate
pip install -r requirements-dev.txt
cd web
pnpm install --frozen-lockfile
pnpm build
cd ..
uvicorn resistlens.api:app --host 127.0.0.1 --port 8000 --workers 1
```

Open <http://127.0.0.1:8000>. Build before starting the API because its static mount is registered at startup. For development, run `pnpm dev` in `web` alongside the API; Vite proxies `/api` to port 8000.

## Migrated workflow

- Start here: independent four-step synthetic walkthrough.
- Overview: synthetic case counts, state and unit filtering, queue CSV, session export, and evidence export.
- Patient workspace: timeline, source evidence, readiness, exact order/report review, five authored risk scenarios, reasoning arithmetic, and fictional transfer lookup.
- Document studio: demo-image replay, labeled-text parsing, or live VLM extraction; editable structured-event JSON; mandatory verification; explicit replacement; separate encounters rejected.
- Evaluation lab: existing parser and rule evaluation.
- AI connection: temporary server-side key and model configuration.
- Vision benchmark: split selection, image preview, one request per image with progress, cumulative metrics, field comparisons, JSON export, and dataset export.
- About and demo: scope and synthetic sample downloads.

The sidebar, light theme, teal hero, navigation names, global demo clock, and page sequence are retained. React uses native tables and forms in place of Streamlit widgets. The structured-event editor is currently JSON. This migration preserves the workflow rather than reproducing every Streamlit pixel.

## Sessions and security boundaries

Session tokens live only in React memory; a refresh starts a new synthetic workspace. Each server session has its own documents, images, audit, key, and benchmark results. Keys never appear in exports. Forget connection and reset explicitly clear the active key. Idle sessions expire after one hour and are removed when later sessions are created. A process restart loses all sessions, so export before restarting.

Run exactly one worker and one instance. In-memory sessions cannot be shared between workers. Public hosting must provide HTTPS. This prototype has bounded request bodies, image and session limits, and serialized per-session mutations. It has no production authentication, distributed rate limiting, durable database, or background cleanup. Use synthetic data only and bring a temporary key; do not configure a shared paid key in the deployment.

## Publish with Render

The repository includes a Dockerfile and `render.yaml`. After these files are committed and pushed:

1. Sign in at <https://dashboard.render.com> and connect the GitHub account that can access `BluePaper1122/resistlens`.
2. Choose **New → Blueprint**.
3. Select the `BluePaper1122/resistlens` repository and its `main` branch.
4. Render reads `render.yaml`. Review the one web service named `resistlens-react`, then choose **Deploy Blueprint**.
5. Wait for the health check at `/api/health` to pass. Open the generated `onrender.com` URL.
6. Test a demo replay, import, review, scorecard, and download before sharing the URL. Test a one-image live benchmark only with a temporary user-provided key.

No deployment API key is needed. The Docker start command listens on Render's `PORT` variable and serves the React bundle and API from the same domain. A static-only host cannot run the Python backend.

The existing Streamlit Community Cloud URL continues serving `app.py`. Keep it active until the new URL passes the smoke test.

## Verify before deployment

```sh
python -m pytest -q
cd web
pnpm build
```

API tests cover session isolation, credential redaction, source verification and replacement, live consent, review linkage, guide isolation, mock lookup, archives, and incremental benchmark accumulation. Existing Python tests continue to cover rules and VLM extraction constraints.

The migration itself does not establish new live-model accuracy. Container behavior, hosted HTTPS, memory limits, and request timeouts still need verification on the chosen host.
