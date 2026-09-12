# Deployment preparation

1. Sign in to [Streamlit Community Cloud](https://share.streamlit.io/) using the account that can access the private repository. Complete any account authorization yourself.
2. Choose Create app, then the existing-app option. Set repository `BluePaper1122/resistlens`, branch `main`, entry file `app.py`.
3. In Advanced settings choose Python 3.12, matching CI. A `.python-version` file alone does not set the cloud runtime. Leave shared OpenAI secrets empty; visitors configure their own session connection.
4. Deploy the intended tested commit. Keep the source repository private. Choose the app's audience deliberately in sharing settings and record the actual generated URL.
5. Check the hosted guided walkthrough, all eight destinations, scorecard and mock transfer lookup, extraction/import, ZIP/JSON downloads and reset behavior. Open two independent browser sessions and confirm cases, transfer history and keys do not cross sessions.
6. Configure a session key through AI connection, run one development image, inspect quotes and fields, then save a small measured development report. Freeze extraction choices before the held-out test run. Record actual model, sample counts and failures.

Source: [official Streamlit deployment instructions](https://docs.streamlit.io/deploy/streamlit-community-cloud/deploy-your-app/deploy), checked 2026-09-12. The documented flow accepts repository/branch/entrypoint and exposes Python selection in Advanced settings.

This app uses ephemeral session memory, has no application authentication or production data governance, and supports fictional records only. Cloud publication does not establish production readiness. API inference may incur charges independently of hosting.
