import test from "node:test";
import assert from "node:assert/strict";
import { putCad, verifyCad, merkleRoot, merkleRootCached, clearMerkleCache } from "./cad.js";
import { appendDagNode, emptyDag, walkAncestors } from "./dag.js";
import { retrieveForPatient } from "./rag.js";
import { commitCadRoot, emptySolanaLocal } from "./solana-local.js";
import {
  encodeMemoBytes,
  explorerTxUrl,
  formatCadMemoMessage,
  parseCadMemoMessage,
} from "./solana-memo.js";
import { embeddingDistance, embeddingFromImageData } from "./tee.js";

test("CAD address equals hash and verifies", async () => {
  const { store, cid } = await putCad({}, "doc_gap", { note: "missing transfer packet" });
  assert.equal(cid.length, 64);
  assert.equal(await verifyCad(store[cid]), true);
});

test("DAG parents form a walkable chain", async () => {
  let dag = emptyDag();
  let cad = {};
  ({ dag, cad } = await appendDagNode(dag, cad, {
    kind: "doc_gap",
    label: "gap",
    payload: { a: 1 },
    patientId: "10",
  }));
  ({ dag, cad } = await appendDagNode(dag, cad, {
    kind: "immunity_score",
    label: "score",
    payload: { ceftriaxone: 0.8 },
    patientId: "10",
  }));
  const tip = dag.nodes[1];
  const ancestors = walkAncestors(dag, tip.id);
  assert.equal(ancestors.length, 2);
  assert.equal(ancestors[0].id, tip.id);
  const chunks = retrieveForPatient(dag, cad, "10");
  assert.ok(chunks.length >= 1);
});

test("Solana-local commits CAD merkle root with memo message", async () => {
  clearMerkleCache();
  let dag = emptyDag();
  let cad = {};
  ({ dag, cad } = await appendDagNode(dag, cad, {
    kind: "handoff",
    label: "ED to ICU",
    payload: { missing: ["pressor rate"] },
  }));
  const { state, commitment } = await commitCadRoot(emptySolanaLocal(), cad, dag);
  assert.equal(state.slot, 1);
  assert.equal(commitment.cadRoot.length, 64);
  assert.equal(commitment.mode, "local");
  const parsed = parseCadMemoMessage(commitment.message);
  assert.equal(parsed.cadRoot, commitment.cadRoot);
  assert.equal(parsed.cidCount, 1);
  assert.equal((await merkleRoot(Object.keys(cad))).length, 64);
});

test("merkleRootCached returns same root without changing fingerprint", async () => {
  clearMerkleCache();
  const cids = ["aaa", "bbb", "ccc"];
  const a = await merkleRootCached(cids);
  const b = await merkleRootCached([...cids].reverse());
  assert.equal(a, b);
  assert.equal(a, await merkleRoot(cids));
});

test("CAD memo message round-trips and rejects PHI-sized payloads", () => {
  const cadRoot = "ab".repeat(32);
  const message = formatCadMemoMessage({
    cadRoot,
    dagTip: "tipdeadbeef01",
    cidCount: 4,
  });
  assert.match(message, /^RL1\|[0-9a-f]{64}\|tipdeadbeef01\|4$/);
  assert.deepEqual(parseCadMemoMessage(message), {
    version: 1,
    cadRoot,
    dagTip: "tipdeadbeef01",
    cidCount: 4,
  });
  const bytes = encodeMemoBytes(message);
  assert.ok(bytes.byteLength < 120);
  assert.throws(() => formatCadMemoMessage({ cadRoot: "short", dagTip: "x", cidCount: 1 }));
  assert.equal(
    explorerTxUrl("SigExample", "devnet"),
    "https://explorer.solana.com/tx/SigExample?cluster=devnet",
  );
  assert.equal(
    explorerTxUrl("SigExample", "mainnet-beta"),
    "https://explorer.solana.com/tx/SigExample",
  );
});

test("face embedding distance is zero for identical templates", () => {
  const pixels = new Uint8ClampedArray(16 * 16 * 4);
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = 40;
    pixels[i + 1] = 80;
    pixels[i + 2] = 120;
    pixels[i + 3] = 255;
  }
  const data = { width: 16, height: 16, data: pixels };
  const emb = embeddingFromImageData(data);
  assert.equal(emb.length, 64);
  assert.ok(embeddingDistance(emb, emb) < 1e-9);
});
