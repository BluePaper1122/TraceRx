import type { PatientSummary } from "@/lib/types"

export function EvidenceStatusCell({ patient }: { patient: PatientSummary }) {
  if (!patient.externalDataAvailable && patient.transferPatient) {
    return <span className="text-sm text-data-missing">External history unavailable</span>
  }
  if (patient.externalDataAvailable) {
    return <span className="text-sm text-verified">External history verified</span>
  }
  if (patient.evidenceCompleteness < 50) {
    return <span className="text-sm text-data-missing">Limited local evidence</span>
  }
  return <span className="text-sm text-muted-foreground">Local evidence only</span>
}
