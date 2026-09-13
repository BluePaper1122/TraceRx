import { createHash, randomBytes } from "node:crypto";

export function sha256Hex(input) {
  return createHash("sha256")
    .update(typeof input === "string" ? input : String(input))
    .digest("hex");
}

export function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
}

export function newId(prefix = "id") {
  return `${prefix}_${randomBytes(8).toString("hex")}`;
}
