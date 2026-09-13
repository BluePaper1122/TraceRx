"""Provider-agnostic explanation of an already-computed DrugResistancePrediction.

The model never calculates, adjusts, or re-derives the resistance-risk score.
It only explains a structured prediction supplied to it, grounded further by a
small curated reference corpus retrieved by plain keyword overlap (no vector
store — appropriate for this fixed, ~10-entry corpus). If no provider is
configured, or the provider is unreachable, the deterministic scorecard
produced by risk_engine.py is completely unaffected; only this layer degrades.

Any one of Groq, Google Gemini, Anthropic Claude or OpenAI works: whichever
API key is present in the environment is used. Set AI_PROVIDER to pick
explicitly when several are configured, and AI_MODEL to override the model.
"""
import json
import os
import re

import httpx

from .risk_models import DrugResistancePrediction

# Probed in this order; the first provider with a key present wins unless
# AI_PROVIDER names one explicitly. Groq, Gemini and OpenAI all speak the
# OpenAI chat-completions shape; Anthropic uses its own messages API.
PROVIDERS = {
    "groq": {
        "env": "GROQ_API_KEY",
        "url": "https://api.groq.com/openai/v1/chat/completions",
        "model": "openai/gpt-oss-20b",
        "style": "openai",
    },
    "gemini": {
        "env": "GEMINI_API_KEY",
        "url": "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        "model": "gemini-2.0-flash",
        "style": "openai",
    },
    "anthropic": {
        "env": "ANTHROPIC_API_KEY",
        "url": "https://api.anthropic.com/v1/messages",
        "model": "claude-sonnet-4-5",
        "style": "anthropic",
    },
    "openai": {
        "env": "OPENAI_API_KEY",
        "url": "https://api.openai.com/v1/chat/completions",
        "model": "gpt-4o-mini",
        "style": "openai",
    },
}

CORPUS = [
    {
        "id": "methodology-pipeline",
        "title": "TraceRx scoring methodology — evidence pipeline",
        "source_label": "Project scoring methodology (illustrative)",
        "content": (
            "The illustrative score starts from a matching local antibiogram baseline for the "
            "same unit, organism and infection type; if none matches, an explicit 0.15 fallback "
            "is used and flagged BASELINE_UNAVAILABLE. Colonization with a relevant organism adds "
            "up to +0.35, decayed by category and age. A prior culture for the same organism/drug "
            "adds +0.45 for a resistant (R) result, +0.15 for intermediate (I), or subtracts 0.25 "
            "for susceptible (S), also decayed by age. Recent antibiotic exposure in the last 90 "
            "days adds +0.15, unless a resistant culture already reflects that same exposure window "
            "— in which case no extra weight is added, to avoid double-counting one underlying story. "
            "The final score is clamped to the 0.01–0.99 display range."
        ),
    },
    {
        "id": "methodology-decay",
        "title": "TraceRx scoring methodology — decay and persistence",
        "source_label": "Project scoring methodology (illustrative)",
        "content": (
            "Evidence categories decay differently. Routine organisms: full weight up to 6 months, "
            "half weight up to 12 months, 20% weight beyond that. High-consequence organisms: full "
            "weight up to 12 months, 80% weight beyond that. MRSA colonization persists at full "
            "weight indefinitely unless the patient has BOTH a documented decolonization date AND a "
            "later negative rescreen date — only then does it clear to zero. Historical positive "
            "evidence is never deleted from the record; only its weight in the current score changes."
        ),
    },
    {
        "id": "methodology-missing-data",
        "title": "TraceRx scoring methodology — missing and incomplete data",
        "source_label": "Project scoring methodology (illustrative)",
        "content": (
            "Test status is tracked as documented, not_ordered, or unknown — these are never treated "
            "as a negative result. A DATA_GAP_UNORDERED flag means no test was ordered, not that it "
            "came back clean. A TEST_STATUS_UNKNOWN flag means the record does not say either way. "
            "DATA_UNAVAILABLE specifically marks a patient transferred from another facility whose "
            "prior records have not yet been retrieved. AGED_POSITIVE marks a positive result that "
            "is still counted but at reduced weight due to its age. None of these flags lower the "
            "score toward zero — missing information changes confidence in the record, not the "
            "arithmetic itself."
        ),
    },
    {
        "id": "ledger-provenance",
        "title": "TraceRx transfer record verification",
        "source_label": "Project safety rules",
        "content": (
            "When a resistance-relevant record is retrieved from a fictional partner institution, it "
            "is checked against a stored SHA-256 fingerprint of its own content before being applied. "
            "A mismatch is reported as verification_failed and the record is not applied. This is an "
            "in-memory demonstration of scoped lookup and fingerprint verification — it is not a "
            "production ledger, not encrypted transport, and not a compliance mechanism."
        ),
    },
    {
        "id": "safety-ai-boundary",
        "title": "TraceRx safety rules — AI assistant boundary",
        "source_label": "Project safety rules",
        "content": (
            "The Clinical Evidence Assistant explains an already-computed illustrative score. It does "
            "not calculate, adjust, or re-derive any resistance score, does not diagnose infection, "
            "does not recommend a treatment or antibiotic, and does not recommend dosing. If a "
            "question falls outside what the supplied prediction and reference material support, the "
            "assistant says so rather than guessing. Scores here are illustrative and additive, not a "
            "calibrated clinical probability of resistance or treatment failure."
        ),
    },
]

_STOPWORDS = {
    "the", "a", "an", "is", "are", "was", "were", "did", "does", "do", "of", "in", "on", "for",
    "to", "and", "or", "this", "that", "what", "why", "how", "which", "with", "it", "its", "as",
    "at", "by", "be", "been", "has", "have", "had", "not", "than", "then", "so", "still", "role",
}


def _tokenize(text):
    words = re.findall(r"[a-z0-9]+", text.lower())
    return [w for w in words if len(w) > 2 and w not in _STOPWORDS]


def retrieve(query, limit=4):
    """Plain keyword-overlap retrieval over the fixed CORPUS above."""
    query_tokens = set(_tokenize(query))
    scored = []
    for chunk in CORPUS:
        chunk_tokens = set(_tokenize(chunk["title"] + " " + chunk["content"]))
        score = len(query_tokens & chunk_tokens)
        if score > 0:
            scored.append((score, chunk))
    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [chunk for _, chunk in scored[:limit]]


SYSTEM_PROMPT = """You are the Clinical Evidence Assistant inside TraceRx, a synthetic-data
research prototype for antimicrobial resistance-risk intelligence.

You explain a "prediction" that has ALREADY been computed by a separate deterministic engine.
You do not calculate, adjust, or estimate any score. You do not diagnose infection. You do not
recommend a treatment, antibiotic, or dosing. You do not answer questions unrelated to the
supplied prediction and reference material.

You are given two kinds of grounding material:
1. "prediction" — the authoritative, already-computed DrugResistancePrediction for this patient
   and scenario. Treat this as ground truth.
2. "referenceMaterial" — supporting methodology/safety-rule chunks retrieved for this question.
   Use these only for general context, never to override or contradict "prediction".

Each entry in "prediction.reasoning_chain" already has decay applied: its "adjustment" value is
the final, already-weighted contribution to the score. Do not multiply "adjustment" by
"decay_modifier" again — "decay_modifier" is shown only to explain how much weight aging or
policy already removed, not as a further multiplier.

Never state or imply that a missing or unavailable data flag means the patient is low risk.
If neither "prediction" nor "referenceMaterial" supports an answer, say the available evidence
is insufficient rather than guessing.

Respond ONLY with a JSON object of this exact shape:
{
  "title": string,
  "summary": string (2-4 sentences),
  "points": string[] (2-5 short bullet points),
  "sources": [{"id": string, "label": string, "type": string}]
}

"sources" must be drawn only from "prediction.reasoning_chain" entries (by source_event_id) and/or
the "id" values of chunks inside "referenceMaterial" — cite only ones you actually used."""


class ExplainError(Exception):
    pass


UNAVAILABLE = "Evidence explanation unavailable. The deterministic scorecard remains available."


def active_provider():
    """The provider this deployment will use, or None when no key is configured."""
    requested = (os.environ.get("AI_PROVIDER") or "").strip().lower()
    if requested:
        config = PROVIDERS.get(requested)
        if config and os.environ.get(config["env"]):
            return requested, config, os.environ[config["env"]]
        return None
    for name, config in PROVIDERS.items():
        key = os.environ.get(config["env"])
        if key:
            return name, config, key
    return None


def _build_request(config, model, api_key, user_content):
    """Both request shapes: OpenAI-compatible chat completions, or Anthropic messages."""
    if config["style"] == "anthropic":
        return (
            {
                "model": model,
                "max_tokens": 1024,
                "temperature": 0.2,
                "system": SYSTEM_PROMPT,
                "messages": [{"role": "user", "content": user_content}],
            },
            {"x-api-key": api_key, "anthropic-version": "2023-06-01"},
        )
    return (
        {
            "model": model,
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
        },
        {"Authorization": "Bearer " + api_key},
    )


def _extract_text(config, body):
    if config["style"] == "anthropic":
        return body["content"][0]["text"]
    return body["choices"][0]["message"]["content"]


def explain(prediction: DrugResistancePrediction, question: str) -> dict:
    selected = active_provider()
    if selected is None:
        raise ExplainError("Clinical Evidence Assistant is not configured on this deployment.")
    provider, config, api_key = selected
    model = os.environ.get("AI_MODEL") or config["model"]

    factor_names = " ".join(f.factor for f in prediction.reasoning_chain)
    chunks = retrieve(question + " " + factor_names)

    user_content = json.dumps(
        {
            "question": question,
            "prediction": prediction.model_dump(mode="json"),
            "referenceMaterial": [
                {"id": c["id"], "title": c["title"], "content": c["content"]} for c in chunks
            ],
        }
    )
    payload, headers = _build_request(config, model, api_key, user_content)

    try:
        response = httpx.post(config["url"], json=payload, headers=headers, timeout=25)
    except httpx.HTTPError:
        raise ExplainError(UNAVAILABLE) from None

    if response.status_code != 200:
        raise ExplainError(UNAVAILABLE)

    try:
        raw = _extract_text(config, response.json())
        # Anthropic has no JSON mode; it may wrap the object in prose or a fence.
        if not raw.lstrip().startswith("{"):
            start, end = raw.find("{"), raw.rfind("}")
            if start == -1 or end == -1:
                raise ValueError("no JSON object in response")
            raw = raw[start : end + 1]
        parsed = json.loads(raw)
        title = parsed["title"]
        summary = parsed["summary"]
        points = list(parsed.get("points") or [])
        sources = list(parsed.get("sources") or [])
    except (KeyError, IndexError, ValueError):
        raise ExplainError(UNAVAILABLE) from None

    return {
        "title": title,
        "summary": summary,
        "points": points,
        "sources": sources,
        "provider": provider,
        "model": model,
        "retrievedReferences": [
            {"id": c["id"], "title": c["title"], "sourceLabel": c["source_label"]} for c in chunks
        ],
    }
