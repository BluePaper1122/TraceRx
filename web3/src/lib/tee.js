const VAULT_KEY = "tracerx.web3.tee.v1";
const ATTEST_KEY = "tracerx.web3.attest.v1";

function randomAttestation() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return `tee-local-${[...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

function emptyVault() {
  return {
    sealed: true,
    attestation:
      typeof window !== "undefined"
        ? localStorage.getItem(ATTEST_KEY) ?? randomAttestation()
        : "tee-boot",
    persona: null,
    sessionUnlocked: false,
    unlockedAt: null,
    cadRoot: null,
    solanaLocalSlot: 0,
  };
}

export function loadVault() {
  if (typeof window === "undefined") return emptyVault();
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    return raw ? JSON.parse(raw) : emptyVault();
  } catch {
    return emptyVault();
  }
}

export function saveVault(vault) {
  if (typeof window === "undefined") return;
  localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
  localStorage.setItem(ATTEST_KEY, vault.attestation);
}

export function enrollPersona(vault, input) {
  const next = {
    ...vault,
    persona: { ...input, enrolledAt: new Date().toISOString() },
    sessionUnlocked: true,
    unlockedAt: new Date().toISOString(),
  };
  saveVault(next);
  return next;
}

export function embeddingDistance(a, b) {
  const n = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < n; i += 1) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

export function unlockWithFace(vault, probe, threshold = 0.18) {
  if (!vault.persona) return vault;
  if (embeddingDistance(vault.persona.faceTemplate, probe) > threshold) {
    return { ...vault, sessionUnlocked: false, unlockedAt: null };
  }
  const next = {
    ...vault,
    sessionUnlocked: true,
    unlockedAt: new Date().toISOString(),
  };
  saveVault(next);
  return next;
}

export function lockVault(vault) {
  const next = { ...vault, sessionUnlocked: false, unlockedAt: null };
  saveVault(next);
  return next;
}

export function clearPersona(vault) {
  const next = {
    ...vault,
    persona: null,
    sessionUnlocked: false,
    unlockedAt: null,
  };
  saveVault(next);
  return next;
}

export function setCadRoot(vault, root, slot) {
  const next = { ...vault, cadRoot: root, solanaLocalSlot: slot };
  saveVault(next);
  return next;
}

export function embeddingFromImageData(data) {
  const { width, height, data: pixels } = data;
  const grid = 8;
  const cellW = Math.floor(width / grid) || 1;
  const cellH = Math.floor(height / grid) || 1;
  const vec = [];
  for (let gy = 0; gy < grid; gy += 1) {
    for (let gx = 0; gx < grid; gx += 1) {
      let sum = 0;
      let count = 0;
      for (let y = gy * cellH; y < Math.min(height, (gy + 1) * cellH); y += 2) {
        for (let x = gx * cellW; x < Math.min(width, (gx + 1) * cellW); x += 2) {
          const i = (y * width + x) * 4;
          sum += 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
          count += 1;
        }
      }
      vec.push(count ? sum / count / 255 : 0);
    }
  }
  const mean = vec.reduce((a, b) => a + b, 0) / vec.length;
  const normed = vec.map((v) => v - mean);
  const mag = Math.sqrt(normed.reduce((a, b) => a + b * b, 0)) || 1;
  return normed.map((v) => v / mag);
}

export async function captureEmbedding(video) {
  const canvas = document.createElement("canvas");
  const size = 128;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  const side = Math.min(video.videoWidth, video.videoHeight);
  const sx = (video.videoWidth - side) / 2;
  const sy = (video.videoHeight - side) / 2;
  ctx.drawImage(video, sx, sy, side, side, 0, 0, size, size);
  return embeddingFromImageData(ctx.getImageData(0, 0, size, size));
}
