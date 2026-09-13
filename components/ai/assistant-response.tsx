import { Library } from "lucide-react"
import type { ExplainResponse } from "@/lib/types"
import { SourceCitation } from "./source-citation"

export function AssistantResponse({ response }: { response: ExplainResponse }) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-semibold">{response.title}</h3>
      <p className="text-sm text-muted-foreground">{response.summary}</p>

      {response.points.length > 0 && (
        <ul className="list-disc space-y-1 pl-4 text-sm">
          {response.points.map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ul>
      )}

      {response.sources.length > 0 && (
        <div className="space-y-1.5 border-t border-border pt-3">
          <p className="text-xs font-medium text-muted-foreground">Sources</p>
          <ul className="space-y-1">
            {response.sources.map((source, i) => (
              <SourceCitation key={source.id} source={source} index={i} />
            ))}
          </ul>
        </div>
      )}

      {response.retrievedReferences && response.retrievedReferences.length > 0 && (
        <div className="space-y-1.5 border-t border-border pt-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Library className="h-3.5 w-3.5" aria-hidden="true" />
            Reference material retrieved for this question
          </p>
          <ul className="space-y-1">
            {response.retrievedReferences.map((ref) => (
              <li key={ref.id} className="text-xs text-muted-foreground">
                {ref.title} <span className="text-muted-foreground/70">— {ref.sourceLabel}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="border-t border-border pt-2 text-xs text-muted-foreground">
        AI-generated explanation of deterministic evidence. The AI does not calculate the risk score.
      </p>
    </div>
  )
}
