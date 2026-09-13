import { createServer } from "node:http";
import { newId, sha256Hex, stableStringify } from "./crypto.js";
import { getPatient, listPatients, scorePatient } from "./immunity.js";
import { loadStore, saveStore } from "./store.js";

const PORT = Number(process.env.WEB3_API_PORT || 18447);
const HOST = process.env.WEB3_API_HOST || "127.0.0.1";

function send(res, status, body) {
  const payload = status === 204 ? "" : JSON.stringify(body ?? {});
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,x-session-token",
    "cache-control": "no-store",
  });
  res.end(payload);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function putCad(store, kind, payload, meta = {}) {
  const bytes = stableStringify(payload);
  const cid = sha256Hex(bytes);
  store.cad[cid] = {
    cid,
    kind,
    createdAt: new Date().toISOString(),
    bytes,
    payload,
    meta,
  };
  return cid;
}

function merkleRoot(store) {
  const cids = Object.keys(store.cad).sort();
  if (!cids.length) return sha256Hex("empty-cad-root");
  return sha256Hex(cids.join("|"));
}

function ensureDag(store) {
  if (!store.dag) store.dag = { nodes: [], byId: {} };
  if (!store.dag.nodes) store.dag.nodes = [];
  if (!store.dag.byId) store.dag.byId = {};
  if (!store.cad) store.cad = {};
  if (!store.commitments) store.commitments = [];
  if (!store.sessions) store.sessions = {};
}

function appendDag(store, nodeInput, cadCid) {
  ensureDag(store);
  const parents =
    nodeInput.parentIds?.length
      ? nodeInput.parentIds
      : store.dag.nodes.length
        ? [store.dag.nodes[store.dag.nodes.length - 1].id]
        : [];
  const id = sha256Hex(
    stableStringify({
      cid: cadCid,
      parents,
      kind: nodeInput.kind,
      t: Date.now(),
    }),
  ).slice(0, 16);
  const node = {
    id,
    kind: nodeInput.kind,
    parentIds: parents,
    cadCid,
    label: nodeInput.label,
    patientId: nodeInput.patientId ? String(nodeInput.patientId) : null,
    createdAt: new Date().toISOString(),
  };
  store.dag.nodes.push(node);
  store.dag.byId[id] = node;
  return node;
}

function ragRetrieve(store, patientId, limit = 8) {
  ensureDag(store);
  return store.dag.nodes
    .filter((n) => !patientId || n.patientId === String(patientId))
    .slice(-limit)
    .reverse()
    .map((n) => ({
      node: n,
      cad: store.cad[n.cadCid] || null,
    }));
}

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    send(res, 204);
    return;
  }

  const url = new URL(req.url || "/", `http://${HOST}:${PORT}`);
  const path = url.pathname;

  try {
    if (req.method === "GET" && path === "/api/health") {
      const store = loadStore();
      ensureDag(store);
      send(res, 200, {
        ok: true,
        service: "resistlens-web3-backend",
        author: "Niha",
        features: ["tee-session", "cad", "dag", "rag", "immunity", "solana-commit-registry"],
        counts: {
          cad: Object.keys(store.cad).length,
          dag: store.dag.nodes.length,
          commitments: store.commitments.length,
        },
      });
      return;
    }

    if (req.method === "POST" && path === "/api/session/open") {
      const body = await readJson(req);
      const store = loadStore();
      ensureDag(store);
      const token = newId("sess");
      store.sessions[token] = {
        doctorName: String(body.doctorName || "Doctor").slice(0, 80),
        openedAt: new Date().toISOString(),
        // Face templates stay in the browser TEE — server only records unlock attestation.
        faceAttested: Boolean(body.faceAttested),
      };
      saveStore(store);
      send(res, 200, { token, session: store.sessions[token] });
      return;
    }

    if (req.method === "GET" && path === "/api/immunity/patients") {
      send(res, 200, { patients: listPatients() });
      return;
    }

    if (req.method === "GET" && path.startsWith("/api/immunity/patients/") && path.endsWith("/score")) {
      const id = path.split("/")[4];
      const drug = url.searchParams.get("drug") || "ceftriaxone";
      const score = scorePatient(id, drug);
      if (!score) {
        send(res, 404, { error: "patient_not_found" });
        return;
      }
      send(res, 200, score);
      return;
    }

    if (req.method === "GET" && path.startsWith("/api/immunity/patients/")) {
      const id = path.split("/").pop();
      const patient = getPatient(id);
      if (!patient) {
        send(res, 404, { error: "patient_not_found" });
        return;
      }
      send(res, 200, patient);
      return;
    }

    if (req.method === "POST" && path === "/api/cad") {
      const body = await readJson(req);
      if (!body.kind || body.payload == null) {
        send(res, 400, { error: "kind_and_payload_required" });
        return;
      }
      const store = loadStore();
      ensureDag(store);
      const cid = putCad(store, String(body.kind), body.payload, body.meta || {});
      const root = merkleRoot(store);
      saveStore(store);
      send(res, 200, { cid, merkleRoot: root, object: store.cad[cid] });
      return;
    }

    if (req.method === "GET" && path === "/api/cad/merkle") {
      const store = loadStore();
      ensureDag(store);
      send(res, 200, {
        merkleRoot: merkleRoot(store),
        cidCount: Object.keys(store.cad).length,
      });
      return;
    }

    if (req.method === "GET" && path.startsWith("/api/cad/")) {
      const cid = path.slice("/api/cad/".length);
      const store = loadStore();
      const obj = store.cad?.[cid];
      if (!obj) {
        send(res, 404, { error: "cid_not_found" });
        return;
      }
      send(res, 200, obj);
      return;
    }

    if (req.method === "GET" && path === "/api/dag") {
      const store = loadStore();
      ensureDag(store);
      send(res, 200, store.dag);
      return;
    }

    if (req.method === "POST" && path === "/api/dag/events") {
      const body = await readJson(req);
      if (!body.kind || !body.label) {
        send(res, 400, { error: "kind_and_label_required" });
        return;
      }
      const store = loadStore();
      ensureDag(store);
      const cid = putCad(
        store,
        body.kind,
        {
          label: body.label,
          payload: body.payload ?? {},
          patientId: body.patientId || null,
        },
        { source: "dag" },
      );
      const node = appendDag(store, body, cid);
      const root = merkleRoot(store);
      saveStore(store);
      send(res, 200, { node, cid, merkleRoot: root });
      return;
    }

    if (req.method === "POST" && path === "/api/rag/query") {
      const body = await readJson(req);
      const store = loadStore();
      ensureDag(store);
      const hits = ragRetrieve(store, body.patientId, Number(body.limit) || 8);
      send(res, 200, {
        patientId: body.patientId || null,
        hits,
        prompt: hits
          .map((h) => `- ${h.node.label} (${h.node.kind}) cid=${String(h.node.cadCid).slice(0, 12)}…`)
          .join("\n"),
      });
      return;
    }

    if (req.method === "POST" && path === "/api/demo/seed") {
      const store = loadStore();
      ensureDag(store);
      const score = scorePatient("2");
      const cid = putCad(store, "immunity_score", score, { demo: true });
      const node = appendDag(
        store,
        {
          kind: "immunity_score",
          label: "Immunity module scored #2",
          patientId: "2",
          payload: score,
        },
        cid,
      );
      const cid10 = putCad(
        store,
        "continuity_gap",
        { patientId: "10", reason: "transfer_file_unavailable" },
        { trap: true },
      );
      appendDag(
        store,
        {
          kind: "continuity_gap",
          label: "Immunity waiting on unavailable file #10",
          patientId: "10",
          parentIds: [node.id],
        },
        cid10,
      );
      const root = merkleRoot(store);
      saveStore(store);
      send(res, 200, {
        ok: true,
        merkleRoot: root,
        tip: store.dag.nodes[store.dag.nodes.length - 1],
        cidCount: Object.keys(store.cad).length,
      });
      return;
    }

    if (req.method === "GET" && path === "/api/solana/commitments") {
      const store = loadStore();
      ensureDag(store);
      send(res, 200, { commitments: store.commitments });
      return;
    }

    if (req.method === "POST" && path === "/api/solana/commitments") {
      const body = await readJson(req);
      if (!body.merkleRoot || !String(body.merkleRoot).match(/^[a-f0-9]{64}$/i)) {
        send(res, 400, { error: "merkleRoot_64_hex_required" });
        return;
      }
      if (body.memo && String(body.memo).length > 200) {
        send(res, 400, { error: "memo_too_large_possible_phi" });
        return;
      }
      if (/patient|mrn|dob|ssn/i.test(String(body.memo || ""))) {
        send(res, 400, { error: "memo_rejects_phi_keywords" });
        return;
      }
      const store = loadStore();
      ensureDag(store);
      const entry = {
        id: newId("commit"),
        merkleRoot: String(body.merkleRoot).toLowerCase(),
        dagTip: body.dagTip || null,
        cidCount: Number(body.cidCount) || Object.keys(store.cad).length,
        cluster: body.cluster || "devnet",
        signature: body.signature || null,
        local: Boolean(body.local) || !body.signature,
        memo:
          body.memo ||
          `RL1|${String(body.merkleRoot).toLowerCase()}|${body.dagTip || "tip"}|${
            Number(body.cidCount) || Object.keys(store.cad).length
          }`,
        recordedAt: new Date().toISOString(),
      };
      store.commitments.unshift(entry);
      store.commitments = store.commitments.slice(0, 100);
      saveStore(store);
      send(res, 200, { commitment: entry });
      return;
    }

    send(res, 404, { error: "not_found", path });
  } catch (err) {
    send(res, 500, { error: "server_error", message: String(err?.message || err) });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`ResistLens web3 backend (Niha) http://${HOST}:${PORT}`);
  console.log(`Health: http://${HOST}:${PORT}/api/health`);
});
