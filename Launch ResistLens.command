#!/bin/bash
# Double-click this file in Finder to run ResistLens.
cd -- "$(dirname -- "$0")" || exit 1
if [ -x .venv/bin/python ] && .venv/bin/python -c 'import streamlit' >/dev/null 2>&1; then
    RESISTLENS_PYTHON="$PWD/.venv/bin/python"
elif [ -x ../../work/venv/bin/python ] && ../../work/venv/bin/python -c 'import streamlit' >/dev/null 2>&1; then
    RESISTLENS_PYTHON="$PWD/../../work/venv/bin/python"
else
    python3 -m venv .venv || exit 1
    .venv/bin/python -m pip install -r requirements.txt || exit 1
    RESISTLENS_PYTHON="$PWD/.venv/bin/python"
fi
RESISTLENS_PORT=$("$RESISTLENS_PYTHON" - <<'PY'
import socket
with socket.socket() as s:
    s.bind(('127.0.0.1', 0))
    print(s.getsockname()[1])
PY
)
printf '\nResistLens is starting. Keep this window open while using the app.\n'
exec "$RESISTLENS_PYTHON" -m streamlit run app.py --server.address 127.0.0.1 --server.port "$RESISTLENS_PORT" --server.headless false
