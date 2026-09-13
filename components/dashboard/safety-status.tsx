import { ShieldCheck } from "lucide-react"

const INVARIANTS = [
  "Missing data never treated as negative",
  "External history unavailable lowers confidence",
  "Historical evidence remains visible",
  "AI does not calculate clinical signal",
]

export function SafetyStatus({ passingScenarios }: { passingScenarios?: { passed: number; total: number } }) {
  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-4">
      <p className="text-sm font-medium">Safety invariants</p>
      <ul className="space-y-1.5">
        {INVARIANTS.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-verified" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
      {passingScenarios && (
        <p className="pt-1 text-xs font-medium text-verified">
          {passingScenarios.passed} / {passingScenarios.total} safety scenarios passing
        </p>
      )}
    </div>
  )
}
