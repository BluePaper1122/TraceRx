import type { PatientRiskAssessment, ProvenanceRecord } from "@/lib/types"
import { VerificationRecord } from "./verification-record"

function buildProvenanceRecords(assessment: PatientRiskAssessment): ProvenanceRecord[] {
  return assessment.timeline
    .filter((event) => event.fhirResourceType && event.recordHash)
    .map((event) => ({
      id: event.id,
      label: event.title,
      institution: event.sourceInstitution ?? "Unknown institution",
      fhirResourceType: event.fhirResourceType!,
      fingerprint: event.recordHash!,
      recordedAt: event.occurredAt,
      verified: event.verified ?? false,
      integrity: event.verified ? "valid" : "unverified",
    }))
}

export function ProvenancePanel({ assessment }: { assessment: PatientRiskAssessment }) {
  const records = buildProvenanceRecords(assessment)

  if (records.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No externally verified records are available for this patient yet.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium">Evidence provenance</h3>
        <p className="text-xs text-muted-foreground">
          The underlying health record stays with its source institution — this shows only
          verified fingerprints, timestamps, and provenance metadata.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {records.map((record) => (
          <VerificationRecord key={record.id} record={record} />
        ))}
      </div>
    </div>
  )
}
