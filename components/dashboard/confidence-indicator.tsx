import { CONFIDENCE_LABEL } from "@/lib/utils/risk"
import type { ConfidenceLevel } from "@/lib/types"
import { cn } from "@/lib/utils"

/** Compact row-level confidence label, distinct from the whole-assessment ConfidencePill. */
export function ConfidenceIndicator({
  level,
  className,
}: {
  level: ConfidenceLevel
  className?: string
}) {
  const dotColor: Record<ConfidenceLevel, string> = {
    high: "bg-verified",
    medium: "bg-risk-moderate",
    low: "bg-data-missing",
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotColor[level])} aria-hidden="true" />
      {CONFIDENCE_LABEL[level]}
    </span>
  )
}
