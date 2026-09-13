import { ShieldCheck } from "lucide-react"
import type { ProvenanceRecord } from "@/lib/types"
import { formatDate } from "@/lib/utils/dates"
import { IntegrityBadge } from "./integrity-badge"

export function VerificationRecord({ record }: { record: ProvenanceRecord }) {
  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-verified" aria-hidden="true" />
          <p className="text-sm font-medium">{record.label}</p>
        </div>
        <IntegrityBadge integrity={record.integrity} />
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <dt className="text-muted-foreground">Institution</dt>
        <dd>{record.institution}</dd>
        <dt className="text-muted-foreground">FHIR type</dt>
        <dd>{record.fhirResourceType}</dd>
        <dt className="text-muted-foreground">Fingerprint</dt>
        <dd className="font-mono">{record.fingerprint.slice(0, 12)}…</dd>
        <dt className="text-muted-foreground">Recorded</dt>
        <dd>{formatDate(record.recordedAt)}</dd>
      </dl>
    </div>
  )
}
