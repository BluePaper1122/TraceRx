"use client"

import { useMemo, useState } from "react"
import { EvidenceToggles } from "./evidence-toggles"
import { ContributionChart, type ScenarioPoint } from "./contribution-chart"
import { RiskBadge } from "@/components/shared/badges"
import type { CounterfactualScenario, DrugRiskAssessment, EvidenceType } from "@/lib/types"

function scenarioForExcluded(
  excluded: Set<EvidenceType>,
  scenarios: CounterfactualScenario[]
): CounterfactualScenario {
  if (excluded.size === 0) return scenarios.find((s) => s.id === "current") ?? scenarios[0]
  if (excluded.size >= 3) return scenarios.find((s) => s.id === "baseline-only") ?? scenarios[0]

  const only = [...excluded][0]
  const map: Record<string, string> = {
    prior_ast: "without-prior-ast",
    colonization: "without-colonization",
    antibiotic_exposure: "without-recent-exposure",
  }
  if (excluded.size === 1) {
    return scenarios.find((s) => s.id === map[only]) ?? scenarios[0]
  }
  return scenarios.find((s) => s.id === "baseline-only") ?? scenarios[0]
}

export function CounterfactualExplorer({
  drugs,
  scenarios,
}: {
  drugs: DrugRiskAssessment[]
  scenarios: CounterfactualScenario[]
}) {
  const [excluded, setExcluded] = useState<Set<EvidenceType>>(new Set())
  const [selectedDrugId, setSelectedDrugId] = useState(drugs[0]?.id)

  const activeScenario = scenarioForExcluded(excluded, scenarios)

  function toggle(type: EvidenceType, included: boolean) {
    setExcluded((prev) => {
      const next = new Set(prev)
      if (included) next.delete(type)
      else next.add(type)
      return next
    })
  }

  const selectedDrug = drugs.find((d) => d.id === selectedDrugId) ?? drugs[0]

  const chartData: ScenarioPoint[] = useMemo(
    () =>
      scenarios.map((s) => {
        const point = s.drugs.find((d) => d.drugId === selectedDrug?.id)
        return {
          label: s.label,
          score: point?.prototypeScore ?? 0,
          band: point?.riskBand ?? "low",
          active: s.id === activeScenario.id,
        }
      }),
    [scenarios, selectedDrug, activeScenario]
  )

  if (!selectedDrug) return null

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium">Counterfactual Evidence Explorer</h3>
        <p className="text-xs text-muted-foreground">
          What changed this signal? These are precomputed scenarios from the scoring engine — the
          chart does not add or subtract percentages live.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {drugs.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setSelectedDrugId(d.id)}
            aria-pressed={d.id === selectedDrug.id}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              d.id === selectedDrug.id
                ? "border-clinical-primary bg-clinical-primary text-clinical-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {d.drug}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <EvidenceToggles excluded={excluded} onToggle={toggle} />

        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{selectedDrug.drug} across scenarios</p>
            <RiskBadge band={activeScenario.drugs.find((d) => d.drugId === selectedDrug.id)?.riskBand ?? "low"} score={activeScenario.drugs.find((d) => d.drugId === selectedDrug.id)?.prototypeScore} />
          </div>
          <ContributionChart data={chartData} />
        </div>
      </div>
    </div>
  )
}
