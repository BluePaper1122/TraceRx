import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", ".data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

const EMPTY = {
  cad: {},
  dag: { nodes: [], byId: {} },
  commitments: [],
  sessions: {},
};

export function loadStore() {
  try {
    if (!fs.existsSync(STORE_PATH)) return structuredClone(EMPTY);
    const raw = JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
    return {
      ...structuredClone(EMPTY),
      ...raw,
      cad: raw.cad || {},
      dag: { nodes: raw.dag?.nodes || [], byId: raw.dag?.byId || {} },
      commitments: raw.commitments || [],
      sessions: raw.sessions || {},
    };
  } catch {
    return structuredClone(EMPTY);
  }
}

export function saveStore(store) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}
