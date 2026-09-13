import { putCad } from "./cad.js";
import { sha256Hex, stableStringify } from "./crypto.js";

export function emptyDag() {
  return { nodes: [], byId: {} };
}

export async function appendDagNode(dag, cad, input) {
  const parents =
    input.parentIds ?? (dag.nodes.length ? [dag.nodes[dag.nodes.length - 1].id] : []);
  const { store, cid } = await putCad(cad, input.kind, {
    label: input.label,
    payload: input.payload,
    parents,
  });
  const id = (await sha256Hex(stableStringify({ cid, parents, kind: input.kind, t: Date.now() }))).slice(
    0,
    16,
  );
  const node = {
    id,
    kind: input.kind,
    parentIds: parents,
    cadCid: cid,
    label: input.label,
    patientId: input.patientId,
    createdAt: new Date().toISOString(),
  };
  return {
    dag: { nodes: [...dag.nodes, node], byId: { ...dag.byId, [node.id]: node } },
    cad: store,
    node,
  };
}

export function walkAncestors(dag, startId, limit = 12) {
  const out = [];
  const queue = [startId];
  const seen = new Set();
  while (queue.length && out.length < limit) {
    const id = queue.shift();
    if (seen.has(id)) continue;
    seen.add(id);
    const node = dag.byId[id];
    if (!node) continue;
    out.push(node);
    queue.push(...node.parentIds);
  }
  return out;
}

export function tips(dag) {
  const referenced = new Set(dag.nodes.flatMap((n) => n.parentIds));
  return dag.nodes.filter((n) => !referenced.has(n.id));
}
