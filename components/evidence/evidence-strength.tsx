import { cn } from "@/lib/utils"
import type { EvidenceStrength as Strength } from "@/lib/types"
import { EVIDENCE_STRENGTH_DOTS, EVIDENCE_STRENGTH_LABEL } from "@/lib/utils/risk"

export function EvidenceStrength({ strength }: { strength: Strength }) {
  const filled = EVIDENCE_STRENGTH_DOTS[strength]
  const label = EVIDENCE_STRENGTH_LABEL[strength]

  return (
    <div className="flex items-center gap-2" aria-label={`Evidence strength: ${label}`}>
      <div className="flex gap-1" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-2 w-2 rounded-full",
              i < filled ? "bg-clinical-primary" : "bg-muted"
            )}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  )
}
