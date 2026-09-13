import { FileText } from "lucide-react"
import type { ExplainSource } from "@/lib/types"

export function SourceCitation({ source, index }: { source: ExplainSource; index: number }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <span className="mt-0.5 text-xs font-medium text-muted-foreground">{index + 1}.</span>
      <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span>
        {source.label}
        <span className="text-muted-foreground"> — {source.type}</span>
      </span>
    </li>
  )
}
