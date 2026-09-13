import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { RiskBadge } from "@/components/shared/badges"
import { ConfidenceIndicator } from "./confidence-indicator"
import { AntibioticRow } from "./antibiotic-row"
import { EvidenceSheet } from "@/components/evidence/evidence-sheet"
import type { DrugRiskAssessment, PatientRiskAssessment } from "@/lib/types"

export function AntibioticTable({
  drugs,
  assessment,
}: {
  drugs: DrugRiskAssessment[]
  assessment: PatientRiskAssessment
}) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Antibiotic</TableHead>
              <TableHead>Risk signal</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Baseline</TableHead>
              <TableHead>Highest-impact evidence</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drugs.map((drug) => (
              <AntibioticRow key={drug.id} drug={drug} assessment={assessment} />
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y divide-border md:hidden">
        {drugs.map((drug) => (
          <li key={drug.id} className="space-y-2 p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{drug.drug}</span>
              <RiskBadge band={drug.riskBand} score={drug.prototypeScore} />
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <ConfidenceIndicator level={drug.confidence} />
              <span>Baseline {drug.baseline.probability}%</span>
            </div>
            <EvidenceSheet
              drug={drug}
              assessment={assessment}
              trigger={
                <Button variant="outline" size="sm" className="w-full">
                  Why?
                </Button>
              }
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
