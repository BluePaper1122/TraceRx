"use client"

import { ConfidencePill } from "@/components/shared/badges"
import { useAnimatedValue } from "@/lib/hooks/use-animated-value"
import type { ConfidenceLevel } from "@/lib/types"
import { cn } from "@/lib/utils"

const CATEGORY_COUNT = 4

export function EvidenceCompleteness({
  value,
  confidence,
  className,
}: {
  value: number
  confidence: ConfidenceLevel
  className?: string
}) {
  const animated = useAnimatedValue(value)
  const categoriesAvailable = Math.round((value / 100) * CATEGORY_COUNT)
  const coverageLabel = value >= 75 ? "HIGH COVERAGE" : value >= 45 ? "MODERATE COVERAGE" : "LOW COVERAGE"

  return (
    <div className={cn("space-y-2 rounded-lg border border-border bg-card p-4", className)}>
      <p className="text-xs font-medium text-muted-foreground">Evidence completeness</p>
      <p className="text-3xl font-semibold tabular-nums" aria-live="polite">
        {Math.round(animated)}%
      </p>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-clinical-primary transition-[width] duration-300"
          style={{ width: `${animated}%` }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <ConfidencePill level={confidence} />
      </div>
      <p className="text-xs font-medium tracking-wide text-muted-foreground">
        {coverageLabel} · {categoriesAvailable} of {CATEGORY_COUNT} evidence categories available
      </p>
    </div>
  )
}
