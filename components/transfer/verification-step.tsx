import { Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function VerificationStep({
  title,
  items,
  completedCount,
}: {
  title: string
  items: string[]
  completedCount: number
}) {
  return (
    <div className="space-y-2 rounded-md border border-border bg-muted/40 p-3">
      <p className="text-sm font-medium">{title}</p>
      <ul className="space-y-1.5">
        {items.map((item, i) => {
          const done = i < completedCount
          const active = i === completedCount
          return (
            <li key={item} className="flex items-center gap-2 text-sm">
              {done ? (
                <Check className="h-3.5 w-3.5 text-verified" aria-hidden="true" />
              ) : active ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-clinical-primary" aria-hidden="true" />
              ) : (
                <span className="h-3.5 w-3.5 rounded-full border border-border" aria-hidden="true" />
              )}
              <span className={cn(!done && !active && "text-muted-foreground")}>{item}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
