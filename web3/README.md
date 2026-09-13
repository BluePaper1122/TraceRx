# TraceRx · Web3 (Antibiotic Resistance)
**TraceRx** is the main product: a local first hospital **continuity steward**. It watches documentation and handoff gaps that delay care.

The **Immunity module** (the “readme-3” antibiotic-resistance CDS) is **one submodule inside TraceRx** — not a separate product. It answers: *for this patient, is this antibiotic likely to fail?*

This folder (`web3/`) is **additive** Vite app for the safe local stack around that story. It does **not** replace or rewrite  Streamlit core (`app.py`, `tracerx/`, `web/`). Ship it on a **feature branch** so `main` stays compatible until merges deliberately.

> Research only. Synthetic data. Not for clinical use. No PHI on-chain.

---

## Product map

| Layer | Role |
| --- | --- |
| **TraceRx (core)** | Continuity steward — admin delays, missing files, transfer packets, documentation gaps → harm |
| **Immunity module** | Sub-part of TraceRx — personal resistance scoring on a synthetic roster |
| **This `web3/` package** | Local TEE + face gate + CAD + DAG + RAG + Solana memo commitments for continuity/immunity events |

```text
TraceRx (main)
├── Continuity stewardship (team Streamlit / web — untouched here)
└── Immunity module (readme-3 CDS chain)
        └── web3/ safe runtime (this package)
              TEE · face persona · CAD · DAG · RAG · Solana memo roots
```

---

## Immunity module (readme-3, inside TraceRx)

Same clinical framing as the original immunity spec — now explicitly nested under TraceRx:

1. **Unit antibiogram baseline** — population prior, not a personal answer  
2. **Colonization with decay** — organism on *this* body; never-tested ≠ negative  
3. **Prior isolate from this patient** — history beats a clean-looking transfer packet  
4. **~90-day drug exposure** — recent antibiotics reshape risk  

**Trap cases** the module must not paper over:

| Case | Trap |
| --- | --- |
| **#4** | Never tested — blank is risk, not safety |
| **#7** | Old / stale flag that looks “cleared” |
| **#10** | Transfer with unavailable file |

**Patient #2** remains the worked ESBL bacteremia example (colonization + prior cultures + exposures).

Immunity scores are continuity events: they hang off the **DAG**, payloads live in **CAD**, and only a **merkle root** may be committed to Solana.

---

## Safe system (this package)

| Piece | Meaning |
| --- | --- |
| **TEE** | Local sealed vault. Doctor **face persona** unlock. Face templates stay in the browser (`localStorage`); they never leave the device. |
| **CAD** | Content-addressed store — every continuity/immunity payload at its SHA-256 CID. |
| **DAG** | Directed acyclic graph of continuity + immunity events. Parents are explicit. |
| **RAG** | Retrieve CAD payloads along DAG edges before showing context. |
| **Solana** | On-chain **Memo** commitment of CAD merkle root + DAG tip + count. **No PHI**, no clinical text, no patient identifiers as free text. Offline **local fallback** when RPC/wallet is unavailable. |

### Solana memo (no PHI)

```text
RL1|<64-hex-cadRoot>|<dagTip>|<cidCount>
```

Prefer **devnet** for rehearsal (airdrop). Use **mainnet-beta** only for a final live demo (~0.000005 SOL per memo commit).

---

## Branch policy (compatibility)

- Develop and push on: `cursor/niha-web3-tee-cad-dag-d709`
- Diff vs `main` should stay **under `web3/` only**
- Do **not** merge to `main` until teammates confirm Streamlit / `web/` stay green
- Teammates keep running `app.py` as today; optional: also run this package side-by-side

---

## Run (this package only)

```bash
cd web3
npm install
npm test
npm run server   # backend on http://127.0.0.1:18447
npm run dev      # UI on http://127.0.0.1:43137 (proxies /api → backend)
```

Open http://127.0.0.1:43137

### Backend (Niha) — what it does

Local Node API under `web3/server/` (author **Niha**):

| Route | Purpose |
| --- | --- |
| `GET /api/health` | Liveness + feature list |
| `POST /api/session/open` | Records face-unlock attestation (templates stay in browser TEE) |
| `GET /api/immunity/patients` | Synthetic immunity roster (#2 + traps #4/#7/#10) |
| `GET /api/immunity/patients/:id/score` | Readme-3 score chain (antibiogram → colonization → prior → exposure) |
| `POST /api/demo/seed` | Seeds CAD + DAG with #2 score and #10 continuity gap |
| `POST /api/solana/commitments` | Stores memo receipt (`RL1\|root\|tip\|n`) — **no PHI** |

Face templates never leave the browser. Solana still needs a tiny bit of SOL only if you publish a real memo; local commitment works offline.

Optional env (`web3/.env.local`, never commit secrets):

```bash
VITE_SOLANA_CLUSTER=devnet
VITE_WEB3_API=http://127.0.0.1:18447
# VITE_SOLANA_RPC=https://api.devnet.solana.com
# Final demo only:
# VITE_SOLANA_CLUSTER=mainnet-beta
```

### Demo flow

1. Start **server** + **dev** (above).  
2. Enroll / unlock the local TEE (webcam).  
3. **Seed backend + score #2** (Immunity submodule via API).  
4. Optionally **Record local Solana commitment** (or Connect Phantom on devnet for a real memo).  
5. Teammate Streamlit stays unchanged on its own port.

### Teammate Streamlit (unchanged)

From repo root (separate process):

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m streamlit run app.py
```

---

## Author

Niha — additive `web3/` frontend + backend (TraceRx core · Immunity submodule · local TEE/CAD/DAG/Solana).
