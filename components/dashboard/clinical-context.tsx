import type { PatientRiskAssessment } from "@/lib/types"
import { formatDate } from "@/lib/utils/dates"

export function ClinicalContext({ assessment }: { assessment: PatientRiskAssessment }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
      <div>
        <dt className="text-xs text-muted-foreground">Syndrome</dt>
        <dd className="font-medium">{assessment.context.syndrome}</dd>
      </div>
      {assessment.context.organism && (
        <div>
          <dt className="text-xs text-muted-foreground">Organism</dt>
          <dd className="font-medium">{assessment.context.organism}</dd>
        </div>
      )}
      {assessment.context.unit && (
        <div>
          <dt className="text-xs text-muted-foreground">Unit</dt>
          <dd className="font-medium">{assessment.context.unit}</dd>
        </div>
      )}
      <div>
        <dt className="text-xs text-muted-foreground">Assessment generated</dt>
        <dd className="font-medium">{formatDate(assessment.generatedAt)}</dd>
      </div>
    </dl>
  )
}
