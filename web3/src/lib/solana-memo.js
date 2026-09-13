/**
 * Compact on-chain memo payload. CAD merkle root + metadata only — never PHI.
 * Format: RL1|<cadRootHex64>|<dagTip>|<cidCount>
 */
export const MEMO_PREFIX = "RL1";
export const MEMO_PROGRAM_ID = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";

export function formatCadMemoMessage({ cadRoot, dagTip, cidCount }) {
  if (!cadRoot || !/^[0-9a-f]{64}$/i.test(cadRoot)) {
    throw new Error("cadRoot must be 64-char hex");
  }
  const tip = String(dagTip || "genesis").replace(/\|/g, "");
  const n = Number.isFinite(cidCount) ? Math.max(0, Math.floor(cidCount)) : 0;
  return `${MEMO_PREFIX}|${cadRoot.toLowerCase()}|${tip}|${n}`;
}

export function parseCadMemoMessage(message) {
  const parts = String(message).split("|");
  if (parts.length !== 4 || parts[0] !== MEMO_PREFIX) {
    throw new Error("invalid ResistLens CAD memo");
  }
  const [, cadRoot, dagTip, countRaw] = parts;
  if (!/^[0-9a-f]{64}$/i.test(cadRoot)) throw new Error("invalid cadRoot in memo");
  const cidCount = Number(countRaw);
  if (!Number.isFinite(cidCount) || cidCount < 0) throw new Error("invalid cidCount in memo");
  return {
    version: 1,
    cadRoot: cadRoot.toLowerCase(),
    dagTip,
    cidCount,
  };
}

export function encodeMemoBytes(message) {
  return new TextEncoder().encode(message);
}

export function explorerTxUrl(signature, cluster = "devnet") {
  const base = `https://explorer.solana.com/tx/${signature}`;
  if (!cluster || cluster === "mainnet-beta") return base;
  return `${base}?cluster=${cluster}`;
}

export function explorerAddressUrl(address, cluster = "devnet") {
  const base = `https://explorer.solana.com/address/${address}`;
  if (!cluster || cluster === "mainnet-beta") return base;
  return `${base}?cluster=${cluster}`;
}
