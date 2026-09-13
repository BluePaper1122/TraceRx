const API_BASE = import.meta.env.VITE_WEB3_API || "http://127.0.0.1:18447";

async function req(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

export function apiBase() {
  return API_BASE;
}

export const api = {
  health: () => req("/api/health"),
  openSession: (body) =>
    req("/api/session/open", { method: "POST", body: JSON.stringify(body) }),
  listPatients: () => req("/api/immunity/patients"),
  scorePatient: (id) => req(`/api/immunity/patients/${id}/score`),
  seedDemo: () => req("/api/demo/seed", { method: "POST" }),
  recordCommitment: (body) =>
    req("/api/solana/commitments", { method: "POST", body: JSON.stringify(body) }),
  listCommitments: () => req("/api/solana/commitments"),
};
