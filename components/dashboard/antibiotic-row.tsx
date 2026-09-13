import { TableCell, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { RiskBadge } from "@/components/shared/badges"
import { ConfidenceIndicator } from "./confidence-indicator"
import { EvidenceSheet } from "@/components/evidence/evidence-sheet"
import type { DrugRiskAssessment, PatientRiskAssessment } from "@/lib/types"

const STRENGTH_RANK = { very_strong: 4, strong: 3, moderate: 2, weak: 1 } as const

function highestImpactEvidence(drug: DrugRiskAssessment) {
  const patientEvidence = drug.evidence.filter((e) => e.type !== "antibiogram")
  if (patientEvidence.length === 0) return "No patient-specific evidence yet"
  const top = [...patientEvidence].sort(
    (a, b) => STRENGTH_RANK[b.strength] - STRENGTH_RANK[a.strength]
  )[0]
  return top.label
}

export function AntibioticRow({
  drug,
  assessment,
}: {
  drug: DrugRiskAssessment
  assessment: PatientRiskAssessment
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">
        {drug.drug}
        {drug.abbreviation && (
          <span className="ml-1 text-xs text-muted-foreground">({drug.abbreviation})</span>
        )}
      </TableCell>
      <TableCell>
        <RiskBadge band={drug.riskBand} score={drug.prototypeScore} />
      </TableCell>
      <TableCell>
        <ConfidenceIndicator level={drug.confidence} />
      </TableCell>
      <TableCell className="text-muted-foreground">{drug.baseline.probability}%</TableCell>
      <TableCell className="max-w-[220px] truncate text-muted-foreground" title={highestImpactEvidence(drug)}>
        {highestImpactEvidence(drug)}
      </TableCell>
      <TableCell className="text-right">
        <EvidenceSheet
          drug={drug}
          assessment={assessment}
          trigger={
            <Button variant="outline" size="sm">
              Why?
            </Button>
          }
        />
      </TableCell>
    </TableRow>
  )
}
