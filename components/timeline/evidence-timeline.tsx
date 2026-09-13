import type { TimelineEvent as EventType } from "@/lib/types"
import { TimelineEvent } from "./timeline-event"

export function EvidenceTimeline({ events }: { events: EventType[] }) {
  const sorted = [...events].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  )

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No timeline events available for this patient yet.
      </p>
    )
  }

  return (
    <ol className="relative space-y-4 border-l border-border pl-2">
      {sorted.map((event) => (
        <TimelineEvent key={event.id} event={event} />
      ))}
    </ol>
  )
}
