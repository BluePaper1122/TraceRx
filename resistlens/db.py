"""Optional Postgres persistence for durable audit history and AI
explanation logs.

The app's per-process Session model (app.py's `SESSIONS` dict) stays
in-memory by design — see REACT_MIGRATION.md's session/security notes. This
module adds a separate, additive durability layer: every audited action and
every AI explanation is also written to Postgres when DATABASE_URL is
configured, so they survive a process restart and can be queried across
sessions. If DATABASE_URL is absent, or the database is unreachable, every
function here becomes a silent no-op — the demo behaves exactly as it did
before this module existed. A database outage must never break a request.
"""
import hashlib
import json
import os

SCHEMA = """
create table if not exists audit_log (
    id bigserial primary key,
    session_token_hash text not null,
    action text not null,
    detail jsonb not null default '{}'::jsonb,
    recorded_at timestamptz not null default now()
);
create index if not exists audit_log_recorded_at_idx on audit_log (recorded_at desc);

create table if not exists ai_explanations (
    id bigserial primary key,
    patient_id text not null,
    scenario text not null,
    question text not null,
    response jsonb not null,
    prediction jsonb not null,
    created_at timestamptz not null default now()
);
create index if not exists ai_explanations_created_at_idx on ai_explanations (created_at desc);
"""

_conn = None
_disabled = False


def token_hash(token):
    """Never persist a raw session token; store a short, non-reversible reference only."""
    return hashlib.sha256(token.encode()).hexdigest()[:16]


def _get_conn():
    global _conn, _disabled
    if _disabled:
        return None
    url = os.environ.get("DATABASE_URL")
    if not url:
        return None
    if _conn is not None:
        try:
            if not _conn.closed:
                return _conn
        except Exception:
            pass
    try:
        import psycopg

        _conn = psycopg.connect(url, autocommit=True, connect_timeout=5)
        _conn.execute(SCHEMA)
        return _conn
    except Exception:
        _disabled = True
        _conn = None
        return None


def enabled():
    return _get_conn() is not None


def record_audit(session_token_hash, action, detail):
    conn = _get_conn()
    if conn is None:
        return
    try:
        conn.execute(
            "insert into audit_log (session_token_hash, action, detail) values (%s, %s, %s)",
            (session_token_hash, action, json.dumps(detail)),
        )
    except Exception:
        pass


def record_explanation(patient_id, scenario, question, response, prediction):
    conn = _get_conn()
    if conn is None:
        return
    try:
        conn.execute(
            "insert into ai_explanations (patient_id, scenario, question, response, prediction) "
            "values (%s, %s, %s, %s, %s)",
            (patient_id, scenario, question, json.dumps(response), json.dumps(prediction)),
        )
    except Exception:
        pass


def recent_audit(limit=50):
    conn = _get_conn()
    if conn is None:
        return []
    try:
        cur = conn.execute(
            "select session_token_hash, action, detail, recorded_at "
            "from audit_log order by recorded_at desc limit %s",
            (limit,),
        )
        return [
            {
                "session": row[0],
                "action": row[1],
                "detail": row[2],
                "recorded_at": row[3].isoformat(),
            }
            for row in cur.fetchall()
        ]
    except Exception:
        return []
