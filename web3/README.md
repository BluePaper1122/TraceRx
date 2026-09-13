# ResistLens Web3 module

Isolated Vite/React package under `web3/`. Does **not** modify `app.py`, `resistlens/`, or `web/`.

## Stack

- Local **TEE** vault + doctor face persona (webcam, on-device only)
- **CAD** content-addressed records (payloads stay local)
- **DAG** continuity / immunity event graph
- **RAG** retrieval along DAG edges
- **Solana** on-chain commitments via the **Memo program** (`MemoSq4gq…`) — CAD merkle root + tip + count only (**no PHI**)
- Offline **local fallback** commit when RPC/wallet is unavailable

## Solana efficiency ($5 SOL)

Prefer **devnet** for day-to-day demos (free airdrop). Use **mainnet-beta** only for a final live demo commit.

| Approach | Why |
| --- | --- |
| Memo instruction | No rent-exempt account; only base signature fee |
| Typical fee | ~5,000 lamports ≈ **0.000005 SOL** per commit |
| $5 budget | On the order of **hundreds of thousands** of memo commits |
| Payload | Compact `RL1\|<64-hex-root>\|<dagTip>\|<cidCount>` (~90 bytes) |

Do **not** put clinical text, patient IDs as free text, or CAD object bodies on-chain.

### Memo format

```text
RL1|<cadRootHex64>|<dagTip>|<cidCount>
```

Explorer (devnet): `https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet`  
Explorer (mainnet): `https://explorer.solana.com/tx/<SIGNATURE>`

## Env (optional)

Create `web3/.env.local` (never commit secrets):

```bash
VITE_SOLANA_CLUSTER=devnet
# VITE_SOLANA_RPC=https://api.devnet.solana.com
# For a final mainnet demo only:
# VITE_SOLANA_CLUSTER=mainnet-beta
# VITE_SOLANA_RPC=https://api.mainnet-beta.solana.com
```

## Run

```bash
cd web3
npm install
npm test
npm run build
npm run dev
```

Open http://127.0.0.1:43137

## Demo: commit CAD root on Solana

1. Unlock the local TEE (enroll / face unlock).
2. Click **Seed CAD / DAG** (builds local vault + cached merkle root).
3. Leave cluster on **devnet** (default).
4. **Connect Phantom** (preferred) *or* expand “Paste ephemeral secret” for a throwaway key (hackathon only — never commit keys).
5. On devnet, click **Devnet airdrop 1 SOL** if the wallet is empty.
6. Click **Commit CAD root to Solana** → copy the signature / open the Explorer link.
7. If offline, use **Local fallback commit** (same memo message shape, no RPC).

Mainnet tip: keep the $5 SOL wallet for one or two confirmed demo txs after rehearsing on devnet.
