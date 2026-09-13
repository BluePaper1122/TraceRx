import type { ExplainRequest, ExplainResponse } from "@/lib/types"

export async function askClinicalEvidenceAssistant(
  request: ExplainRequest
): Promise<ExplainResponse> {
  const res = await fetch("/api/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error ?? "Evidence explanation unavailable.")
  }

  return res.json()
}
