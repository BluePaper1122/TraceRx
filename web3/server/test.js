import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { listPatients, scorePatient } from "./immunity.js";

const here = path.dirname(fileURLToPath(import.meta.url));

test("immunity lists trap roster", () => {
  const ids = listPatients().map((p) => p.id).sort();
  assert.deepEqual(ids, ["10", "2", "4", "7"]);
});

test("patient #2 ESBL score is high / avoid", () => {
  const s = scorePatient("2");
  assert.equal(s.patientId, "2");
  assert.ok(s.probability >= 0.6);
  assert.equal(s.band, "avoid");
  assert.equal(s.parentProduct, "TraceRx");
  assert.equal(s.module, "immunity");
});

test("trap #4 never-tested adds warn step", () => {
  const s = scorePatient("4");
  assert.ok(s.steps.some((x) => x.id === "colonization" && x.warn));
});

test("HTTP API health + seed + score + commitment", async () => {
  const port = 18448;
  const child = spawn(process.execPath, ["index.js"], {
    cwd: here,
    env: { ...process.env, WEB3_API_PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise((r) => setTimeout(r, 500));
  try {
    const health = await fetch(`http://127.0.0.1:${port}/api/health`).then((r) => r.json());
    assert.equal(health.ok, true);
    assert.ok(health.features.includes("immunity"));

    const seed = await fetch(`http://127.0.0.1:${port}/api/demo/seed`, { method: "POST" }).then((r) =>
      r.json(),
    );
    assert.ok(seed.merkleRoot);
    assert.ok(seed.cidCount >= 2);

    const score = await fetch(`http://127.0.0.1:${port}/api/immunity/patients/2/score`).then((r) =>
      r.json(),
    );
    assert.equal(score.band, "avoid");

    const commit = await fetch(`http://127.0.0.1:${port}/api/solana/commitments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        merkleRoot: seed.merkleRoot,
        dagTip: seed.tip.id,
        cidCount: seed.cidCount,
        local: true,
        cluster: "local",
      }),
    }).then((r) => r.json());
    assert.ok(commit.commitment.memo.startsWith("RL1|"));
  } finally {
    child.kill("SIGTERM");
  }
});
