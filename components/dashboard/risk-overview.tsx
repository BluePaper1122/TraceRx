"use client"

import { RiskBadge } from "@/components/shared/badges"
import { ConfidenceIndicator } from "@/components/dashboard/confidence-indicator"
import { useAnimatedValue } from "@/lib/hooks/use-animated-value"
import { RISK_BAND_TOKEN } from "@/lib/utils/risk"
import type { DrugRiskAssessment } from "@/lib/types"

function DrugBar({ drug }: { drug: DrugRiskAssessment }) {
  const animatedScore = useAnimatedValue(drug.prototypeScore)
  const token = RISK_BAND_TOKEN[drug.riskBand]

  return (
    <li className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">{drug.drug}</span>
        <div className="flex items-center gap-2">
          <RiskBadge band={drug.riskBand} score={drug.prototypeScore} />
          <ConfidenceIndicator level={drug.confidence} />
        </div>
      </div>
      <div
        role="progressbar"
        aria-label={`${drug.drug} prototype resistance-risk signal`}
        aria-valuenow={Math.round(drug.prototypeScore)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={`h-full rounded-full ${token.bg} transition-[width] duration-500`}
          style={{ width: `${animatedScore}%`, backgroundColor: `var(--${cssVarSuffix(drug.riskBand)})` }}
        />
      </div>
    </li>
  )
}

function cssVarSuffix(band: "low" | "moderate" | "high") {
  return `risk-${band}`
}

export function RiskOverview({ drugs }: { drugs: DrugRiskAssessment[] }) {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div>
        <p className="text-sm font-medium">Resistance-risk signals</p>
        <p className="text-xs text-muted-foreground">Prototype resistance-risk signal — not a prediction of treatment failure</p>
      </div>
      <ul className="space-y-4">
        {drugs.map((drug) => (
          <DrugBar key={drug.id} drug={drug} />
        ))}
      </ul>
    </div>
  )
}
