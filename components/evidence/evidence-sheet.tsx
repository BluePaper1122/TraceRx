"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet"
import { RiskBadge, ConfidencePill } from "@/components/shared/badges"
import { EvidenceChain } from "./evidence-chain"
import { ClinicalEvidenceAssistant } from "@/components/ai/clinical-evidence-assistant"
import type { DrugRiskAssessment, PatientRiskAssessment } from "@/lib/types"

export function EvidenceSheet({
  drug,
  assessment,
  trigger,
}: {
  drug: DrugRiskAssessment
  assessment: PatientRiskAssessment
  trigger: React.ReactElement
}) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={trigger} />
      <SheetContent className="flex flex-col gap-0 overflow-y-auto data-[side=right]:sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Why is {drug.drug} flagged?</SheetTitle>
          <SheetDescription>Prototype resistance-risk signal</SheetDescription>
          <div className="flex items-center gap-2 pt-1">
            <RiskBadge band={drug.riskBand} score={drug.prototypeScore} />
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-4 px-4 pb-4">
          <EvidenceChain drug={drug} />

          <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 p-3 text-sm">
            <span className="text-muted-foreground">Evidence completeness</span>
            <span className="font-medium">{assessment.evidenceCompleteness}%</span>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 p-3 text-sm">
            <span className="text-muted-foreground">Confidence</span>
            <ConfidencePill level={assessment.confidence} />
          </div>

          <p className="text-xs text-muted-foreground">
            Prototype research heuristic — not validated for clinical care.
          </p>
        </div>

        <SheetFooter>
          <ClinicalEvidenceAssistant
            patientId={assessment.patientId}
            assessment={assessment}
            presetQuestion={`Why did ${drug.drug}'s signal increase?`}
            trigger={
              <Button variant="outline" className="w-full">
                Ask Clinical Evidence Assistant
              </Button>
            }
          />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
