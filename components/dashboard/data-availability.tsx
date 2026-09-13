import { AvailabilityBadge } from "@/components/shared/badges"
import type { EvidenceAvailabilityMap } from "@/lib/types"

const ROWS: { key: keyof EvidenceAvailabilityMap; label: string }[] = [
  { key: "priorCultures", label: "Prior cultures" },
  { key: "colonization", label: "Colonization" },
  { key: "antibioticExposure", label: "Recent antibiotics" },
  { key: "localAntibiogram", label: "Local antibiogram" },
  { key: "externalHistory", label: "External history" },
]

export function DataAvailability({ availability }: { availability: EvidenceAvailabilityMap }) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <p className="text-sm font-medium">Patient evidence</p>
      <ul className="space-y-2">
        {ROWS.map((row) => (
          <li key={row.key} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{row.label}</span>
            <AvailabilityBadge status={availability[row.key]} />
          </li>
        ))}
      </ul>
    </div>
  )
}
