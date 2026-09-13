import { ShieldCheck } from "lucide-react"
import type { EvidenceContribution as Contribution } from "@/lib/types"
import { EvidenceStrength } from "./evidence-strength"
import { formatDate } from "@/lib/utils/dates"
import { formatDaysAgo } from "@/lib/utils/dates"

const DIRECTION_LABEL = {
  increase: "Increases risk signal",
  decrease: "Decreases risk signal",
  neutral: "Baseline reference",
} as const

export function EvidenceContribution({ evidence }: { evidence: Contribution }) {
  return (
    <div className="space-y-1.5 rounded-md border border-border bg-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{evidence.label}</p>
          {evidence.description && (
            <p className="text-sm text-muted-foreground">{evidence.description}</p>
          )}
        </div>
        {evidence.daysAgo !== undefined && (
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatDaysAgo(evidence.daysAgo)}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <EvidenceStrength strength={evidence.strength} />
        <span className="text-xs text-muted-foreground">{DIRECTION_LABEL[evidence.direction]}</span>
      </div>

      {evidence.provenance && (
        <div className="flex items-center gap-1.5 pt-1 text-xs text-verified">
          <ShieldCheck className="h-3 w-3" aria-hidden="true" />
          <span>
            {evidence.provenance.institution}
            {evidence.observedAt && ` · ${formatDate(evidence.observedAt)}`}
            {evidence.provenance.verified && " · Verified"}
          </span>
        </div>
      )}
    </div>
  )
}
