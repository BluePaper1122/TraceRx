import { Badge } from "@/components/ui/badge"
import { ClinicalDisclaimer } from "@/components/app-shell/clinical-disclaimer"
import type { PatientSummary } from "@/lib/types"

export function PatientHeader({ patient }: { patient: PatientSummary }) {
  return (
    <div className="flex flex-col gap-2 border-b border-border pb-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold tracking-tight">{patient.displayName}</h1>
        {patient.transferPatient && (
          <Badge
            variant="outline"
            className="border-clinical-primary/30 bg-clinical-primary/10 text-clinical-primary"
          >
            TRANSFER PATIENT
          </Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        {patient.infectionContext}
        {patient.organism && (
          <>
            {" "}
            · Organism context: <span className="text-foreground">{patient.organism}</span>
          </>
        )}
      </p>
      <ClinicalDisclaimer variant="compact" />
    </div>
  )
}
