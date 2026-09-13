"use client"

import { useState } from "react"
import { Loader2, Sparkles } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { SuggestedQuestions } from "./suggested-questions"
import { AssistantResponse } from "./assistant-response"
import { askClinicalEvidenceAssistant } from "@/lib/api/explain"
import type { ExplainResponse, PatientRiskAssessment } from "@/lib/types"

type Status = "idle" | "loading" | "error" | "success"

export function ClinicalEvidenceAssistant({
  patientId,
  assessment,
  trigger,
  presetQuestion,
  suggestedQuestions,
}: {
  patientId: string
  assessment: PatientRiskAssessment
  trigger: React.ReactElement
  presetQuestion?: string
  suggestedQuestions?: string[]
}) {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState(presetQuestion ?? "")
  const [status, setStatus] = useState<Status>("idle")
  const [response, setResponse] = useState<ExplainResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [lastAsked, setLastAsked] = useState("")

  async function ask(q: string) {
    if (!q.trim()) return
    setQuestion(q)
    setLastAsked(q)
    setStatus("loading")
    try {
      const res = await askClinicalEvidenceAssistant({ patientId, question: q, assessment })
      setResponse(res)
      setStatus("success")
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Evidence explanation unavailable.")
      setStatus("error")
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next && presetQuestion && status === "idle") {
          ask(presetQuestion)
        }
      }}
    >
      <SheetTrigger render={trigger} />
      <SheetContent className="flex flex-col gap-0 data-[side=right]:sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-clinical-primary" aria-hidden="true" />
            Clinical Evidence Assistant
          </SheetTitle>
          <SheetDescription>
            Ask about the deterministic assessment for this patient. The assistant explains
            evidence already computed — it does not calculate risk.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
          <SuggestedQuestions onSelect={ask} questions={suggestedQuestions} />

          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              ask(question)
            }}
          >
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about this assessment…"
              aria-label="Ask the Clinical Evidence Assistant"
            />
            <Button type="submit" disabled={status === "loading" || !question.trim()}>
              Ask
            </Button>
          </form>

          {status === "loading" && (
            <div className="space-y-2" aria-live="polite" aria-busy="true">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          )}

          {status === "error" && (
            <div className="space-y-2 rounded-lg border border-border bg-card p-4 text-sm">
              <p className="font-medium">Evidence explanation unavailable.</p>
              <p className="text-muted-foreground">{errorMsg}</p>
              <p className="text-muted-foreground">The deterministic assessment remains available.</p>
              <Button variant="outline" size="sm" onClick={() => ask(lastAsked)}>
                Try again
              </Button>
            </div>
          )}

          {status === "success" && response && <AssistantResponse response={response} />}

          {status === "idle" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="hidden h-4 w-4 animate-spin" aria-hidden="true" />
              Choose a suggested question or type your own.
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
