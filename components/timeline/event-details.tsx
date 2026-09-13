import { SusceptibilityChip } from "@/components/shared/badges"
import type { TimelineEvent } from "@/lib/types"
import { formatDate } from "@/lib/utils/dates"

export function EventDetails({ event }: { event: TimelineEvent }) {
  return (
    <div className="space-y-2 border-t border-border pt-2 text-sm">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        {event.sourceInstitution && (
          <>
            <dt className="text-muted-foreground">Source institution</dt>
            <dd>{event.sourceInstitution}</dd>
          </>
        )}
        {event.fhirResourceType && (
          <>
            <dt className="text-muted-foreground">FHIR resource type</dt>
            <dd>{event.fhirResourceType}</dd>
          </>
        )}
        <dt className="text-muted-foreground">Observation date</dt>
        <dd>{formatDate(event.occurredAt)}</dd>
        <dt className="text-muted-foreground">Verification</dt>
        <dd>{event.verified ? "Verified" : "Unverified"}</dd>
        {event.recordHash && (
          <>
            <dt className="text-muted-foreground">Record fingerprint</dt>
            <dd className="font-mono">{event.recordHash.slice(0, 12)}…</dd>
          </>
        )}
      </dl>

      {event.susceptibility && event.susceptibility.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <p className="text-xs font-medium text-muted-foreground">Susceptibility results</p>
          <ul className="flex flex-wrap gap-3">
            {event.susceptibility.map((s) => (
              <li key={s.antibiotic} className="flex items-center gap-2 text-sm">
                <SusceptibilityChip result={s.result} />
                {s.antibiotic}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
