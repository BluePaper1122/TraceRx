"use client"

import { useState } from "react"
import { ChevronDown, Syringe, FlaskConical, Bug, ArrowLeftRight, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TimelineEvent as Event } from "@/lib/types"
import { formatDate } from "@/lib/utils/dates"
import { EventDetails } from "./event-details"

const TYPE_ICON = {
  infection: Activity,
  culture: FlaskConical,
  colonization: Bug,
  antibiotic: Syringe,
  transfer: ArrowLeftRight,
} as const

export function TimelineEvent({ event }: { event: Event }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = TYPE_ICON[event.type]

  return (
    <li className="relative pl-8">
      <span className="absolute top-1 left-0 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card">
        <Icon className="h-3.5 w-3.5 text-clinical-primary" aria-hidden="true" />
      </span>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-start justify-between gap-2 rounded-md py-1 text-left hover:bg-muted/50"
      >
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {formatDate(event.occurredAt).toUpperCase()}
          </p>
          <p className="text-sm font-medium">{event.title}</p>
          {event.description && (
            <p className="text-sm text-muted-foreground">{event.description}</p>
          )}
          {event.sourceInstitution && (
            <p className="text-xs text-muted-foreground">
              {event.sourceInstitution}
              {event.verified && " · Verified"}
            </p>
          )}
        </div>
        <ChevronDown
          className={cn("mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {expanded && (
        <div className="pb-2">
          <EventDetails event={event} />
        </div>
      )}
    </li>
  )
}
