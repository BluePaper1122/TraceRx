import { ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

export function RetrievalSuccess({ onApply }: { onApply: () => void }) {
  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center gap-3 rounded-md border border-verified-border bg-verified-bg p-3">
        <ShieldCheck className="h-5 w-5 text-verified" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium">Verified external history ready</p>
          <p className="text-xs text-muted-foreground">
            Houston General · 3 records verified
          </p>
        </div>
      </div>
      <Button onClick={onApply} className="w-full">
        Apply evidence
      </Button>
    </div>
  )
}
