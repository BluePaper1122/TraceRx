import { cn } from "@/lib/utils"
import type { ProvenanceRecord } from "@/lib/types"

const STYLES: Record<ProvenanceRecord["integrity"], string> = {
  valid: "text-verified bg-verified-bg border-verified-border",
  unverified: "text-data-missing bg-data-missing-bg border-data-missing-border",
  mismatch: "text-risk-high bg-risk-high-bg border-risk-high-border",
}

const LABEL: Record<ProvenanceRecord["integrity"], string> = {
  valid: "VALID",
  unverified: "UNVERIFIED",
  mismatch: "MISMATCH",
}

export function IntegrityBadge({ integrity }: { integrity: ProvenanceRecord["integrity"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold",
        STYLES[integrity]
      )}
    >
      {LABEL[integrity]}
    </span>
  )
}
