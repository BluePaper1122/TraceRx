import { sha256Hex, stableStringify } from "./crypto.js";

/** CAD — content-addressed data. Address = hash(payload). */

export async function putCad(store, kind, payload, meta) {
  const bytes = stableStringify(payload);
  const cid = await sha256Hex(bytes);
  const obj = {
    cid,
    kind,
    createdAt: new Date().toISOString(),
    bytes,
    meta,
  };
  return { store: { ...store, [cid]: obj }, cid };
}

export function getCad(store, cid) {
  return store[cid];
}

export async function verifyCad(obj) {
  return (await sha256Hex(obj.bytes)) === obj.cid;
}

export async function merkleRoot(cids) {
  if (!cids.length) return sha256Hex("empty-cad-root");
  return sha256Hex([...cids].sort().join("|"));
}

/** Avoid re-hashing the full CAD set when the cid set is unchanged. */
let merkleCache = { fingerprint: null, root: null };

export function clearMerkleCache() {
  merkleCache = { fingerprint: null, root: null };
}

export function cadFingerprint(cids) {
  if (!cids.length) return "empty";
  const sorted = [...cids].sort();
  return `${sorted.length}:${sorted[0]}:${sorted[sorted.length - 1]}:${sorted.join(",")}`;
}

export async function merkleRootCached(cids) {
  const fingerprint = cadFingerprint(cids);
  if (merkleCache.fingerprint === fingerprint && merkleCache.root) {
    return merkleCache.root;
  }
  const root = await merkleRoot(cids);
  merkleCache = { fingerprint, root };
  return root;
}
