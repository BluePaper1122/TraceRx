import Link from "next/link"
import { TableCell, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConfidencePill } from "@/components/shared/badges"
import { EvidenceStatusCell } from "./evidence-status-cell"
import type { PatientSummary } from "@/lib/types"

export function PatientRow({ patient }: { patient: PatientSummary }) {
  return (
    <TableRow className={patient.id === "10" ? "bg-clinical-primary/5" : undefined}>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {patient.displayName}
          {patient.transferPatient && (
            <Badge variant="outline" className="border-clinical-primary/30 bg-clinical-primary/10 text-clinical-primary">
              TRANSFER
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{patient.infectionContext}</TableCell>
      <TableCell className="text-muted-foreground">{patient.organism ?? "—"}</TableCell>
      <TableCell>{patient.evidenceCompleteness}%</TableCell>
      <TableCell>
        <ConfidencePill level={patient.confidence} />
      </TableCell>
      <TableCell>
        <EvidenceStatusCell patient={patient} />
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href={`/patients/${patient.id}`}>Open</Link>}
        />
      </TableCell>
    </TableRow>
  )
}
