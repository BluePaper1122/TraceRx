import { merkleRootCached } from "./cad.js";
import { sha256Hex } from "./crypto.js";
import { formatCadMemoMessage } from "./solana-memo.js";

/** Offline Solana-shaped commitment log. PHI never included — CAD root only. */

export function emptySolanaLocal() {
  return { commitments: [], slot: 0, lastOnChain: null };
}

export async function commitCadRoot(state, cad, dag) {
  const cids = Object.keys(cad);
  const cadRoot = await merkleRootCached(cids);
  const tip = dag.nodes.length ? dag.nodes[dag.nodes.length - 1].id : "genesis";
  const message = formatCadMemoMessage({
    cadRoot,
    dagTip: tip,
    cidCount: cids.length,
  });
  const slot = state.slot + 1;
  const signature = (await sha256Hex(`local-solana|${slot}|${message}`)).slice(0, 44);
  const commitment = {
    mode: "local",
    slot,
    signature,
    cadRoot,
    cadRootShort: cadRoot.slice(0, 16),
    dagTip: tip,
    cidCount: cids.length,
    message,
    at: new Date().toISOString(),
  };
  return {
    state: {
      ...state,
      slot,
      commitments: [...(state.commitments || []), commitment],
    },
    commitment,
  };
}

export function recordOnChainCommitment(state, onChain) {
  const slot = state.slot + 1;
  const commitment = {
    mode: "solana",
    slot,
    signature: onChain.signature,
    cadRoot: onChain.cadRoot,
    cadRootShort: onChain.cadRoot.slice(0, 16),
    dagTip: onChain.dagTip,
    cidCount: onChain.cidCount,
    message: onChain.message,
    cluster: onChain.cluster,
    explorerUrl: onChain.explorerUrl,
    at: onChain.at,
  };
  return {
    state: {
      ...state,
      slot,
      lastOnChain: commitment,
      commitments: [...(state.commitments || []), commitment],
    },
    commitment,
  };
}
