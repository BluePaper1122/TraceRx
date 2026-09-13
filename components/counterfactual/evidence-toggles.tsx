"use client"

import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { EvidenceType } from "@/lib/types"

const TOGGLES: { type: EvidenceType; label: string }[] = [
  { type: "prior_ast", label: "Prior AST" },
  { type: "colonization", label: "Colonization" },
  { type: "antibiotic_exposure", label: "Antibiotic exposure" },
]

export function EvidenceToggles({
  excluded,
  onToggle,
}: {
  excluded: Set<EvidenceType>
  onToggle: (type: EvidenceType, included: boolean) => void
}) {
  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-4">
      <p className="text-sm font-medium">Evidence included</p>
      <ul className="space-y-2.5">
        <li className="flex items-center justify-between gap-3">
          <Tooltip>
            <TooltipTrigger render={<span className="text-sm text-muted-foreground">Local antibiogram</span>} />
            <TooltipContent>Always included as the population baseline reference</TooltipContent>
          </Tooltip>
          <Switch checked disabled aria-label="Local antibiogram (always included)" />
        </li>
        {TOGGLES.map((t) => (
          <li key={t.type} className="flex items-center justify-between gap-3">
            <span className="text-sm">{t.label}</span>
            <Switch
              checked={!excluded.has(t.type)}
              onCheckedChange={(checked) => onToggle(t.type, checked)}
              aria-label={t.label}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
