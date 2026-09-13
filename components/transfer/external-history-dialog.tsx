"use client"

import { useEffect, useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { RetrievalProgress } from "./retrieval-progress"
import { VerificationStep } from "./verification-step"
import { RetrievalSuccess } from "./retrieval-success"

type Stage = "searching" | "matched" | "retrieving" | "verifying" | "ready"

const RETRIEVAL_ITEMS = ["Microbiology history", "Colonization history", "Antibiotic exposure"]
const VERIFICATION_ITEMS = ["Record fingerprint", "Source institution", "Timestamp"]

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  )
}

export function ExternalHistoryDialog({
  open,
  onOpenChange,
  onApply,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApply: () => void
}) {
  const [stage, setStage] = useState<Stage>("searching")
  const [retrievingCount, setRetrievingCount] = useState(0)
  const [verifyingCount, setVerifyingCount] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    if (!open) return

    const unit = prefersReducedMotion() ? 60 : 450
    const schedule = (fn: () => void, at: number) => {
      timers.current.push(setTimeout(fn, at))
    }

    schedule(() => {
      setStage("searching")
      setRetrievingCount(0)
      setVerifyingCount(0)
    }, 0)
    schedule(() => setStage("matched"), unit * 1)
    schedule(() => setStage("retrieving"), unit * 2)
    schedule(() => setRetrievingCount(1), unit * 2.7)
    schedule(() => setRetrievingCount(2), unit * 3.4)
    schedule(() => setRetrievingCount(3), unit * 4.1)
    schedule(() => setStage("verifying"), unit * 4.1)
    schedule(() => setVerifyingCount(1), unit * 4.8)
    schedule(() => setVerifyingCount(2), unit * 5.5)
    schedule(() => setVerifyingCount(3), unit * 6.2)
    schedule(() => setStage("ready"), unit * 6.2)

    return () => {
      timers.current.forEach(clearTimeout)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Retrieve verified external history</DialogTitle>
          <DialogDescription>
            Requesting resistance-relevant records from participating institutions.
          </DialogDescription>
        </DialogHeader>

        {(stage === "searching" || stage === "matched") && (
          <RetrievalProgress stage={stage} />
        )}

        {stage === "retrieving" && (
          <VerificationStep
            title="Retrieving FHIR resources"
            items={RETRIEVAL_ITEMS}
            completedCount={retrievingCount}
          />
        )}

        {stage === "verifying" && (
          <VerificationStep
            title="Verifying provenance"
            items={VERIFICATION_ITEMS}
            completedCount={verifyingCount}
          />
        )}

        {stage === "ready" && (
          <RetrievalSuccess
            onApply={() => {
              onApply()
              onOpenChange(false)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
