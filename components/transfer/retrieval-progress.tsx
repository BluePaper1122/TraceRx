import { Loader2, CheckCircle2 } from "lucide-react"

export function RetrievalProgress({ stage }: { stage: "searching" | "matched" }) {
  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center gap-3 rounded-md border border-border bg-muted/40 p-3">
        {stage === "searching" ? (
          <Loader2 className="h-4 w-4 animate-spin text-clinical-primary" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-verified" aria-hidden="true" />
        )}
        <div>
          <p className="text-sm font-medium">
            {stage === "searching" ? "Searching participating institutions" : "Patient match found"}
          </p>
          <p className="text-xs text-muted-foreground">
            {stage === "searching" ? "Houston General · Connecting…" : "Houston General · 3 relevant resistance records"}
          </p>
        </div>
      </div>
    </div>
  )
}
