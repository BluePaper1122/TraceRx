import { ArrowDown } from "lucide-react"
import type { DrugRiskAssessment } from "@/lib/types"
import { EvidenceContribution } from "./evidence-contribution"
import { RiskBadge } from "@/components/shared/badges"

export function EvidenceChain({ drug }: { drug: DrugRiskAssessment }) {
  const baseline = drug.evidence.find((e) => e.type === "antibiogram")
  const patientEvidence = drug.evidence.filter((e) => e.type !== "antibiogram")

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border bg-muted/40 p-3">
        <p className="text-xs font-medium text-muted-foreground">Baseline</p>
        <p className="text-lg font-semibold">{drug.baseline.probability}%</p>
        <p className="text-xs text-muted-foreground">{drug.baseline.source}</p>
      </div>

      {patientEvidence.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No additional patient-specific evidence is available for this drug yet.
        </p>
      ) : (
        patientEvidence.map((evidence) => (
          <div key={evidence.id} className="space-y-2">
            <ArrowDown className="mx-auto h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <EvidenceContribution evidence={evidence} />
          </div>
        ))
      )}

      <ArrowDown className="mx-auto h-4 w-4 text-muted-foreground" aria-hidden="true" />

      <div className="flex items-center justify-between rounded-md border border-clinical-primary/30 bg-clinical-primary/5 p-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Final prototype signal</p>
          <p className="text-lg font-semibold">{drug.prototypeScore}%</p>
        </div>
        <RiskBadge band={drug.riskBand} />
      </div>

      {baseline === undefined && (
        <p className="text-xs text-muted-foreground">Baseline reference unavailable.</p>
      )}
    </div>
  )
}
