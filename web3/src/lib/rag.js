import { getCad } from "./cad.js";
import { tips, walkAncestors } from "./dag.js";

export function retrieveForPatient(dag, cad, patientId, limit = 8) {
  const relevant = dag.nodes.filter((n) => n.patientId === patientId);
  const seeds = relevant.length ? relevant.slice(-3) : tips(dag).slice(-2);
  const collected = [];
  for (const seed of seeds) collected.push(...walkAncestors(dag, seed.id, 6));
  const unique = new Map();
  for (const node of collected) unique.set(node.id, node);

  return [...unique.values()].slice(0, limit).map((node) => {
    const obj = getCad(cad, node.cadCid);
    let excerpt = node.label;
    if (obj) {
      try {
        const parsed = JSON.parse(obj.bytes);
        excerpt = `${parsed.label ?? node.label} · ${JSON.stringify(parsed.payload).slice(0, 100)}`;
      } catch {
        excerpt = node.label;
      }
    }
    return {
      nodeId: node.id,
      kind: node.kind,
      label: node.label,
      excerpt,
      cadCid: node.cadCid,
    };
  });
}

export function continuityPrompt(chunks) {
  if (!chunks.length) return "No continuity context in CAD/DAG yet.";
  return chunks.map((c, i) => `${i + 1}. [${c.kind}] ${c.excerpt}`).join("\n");
}
