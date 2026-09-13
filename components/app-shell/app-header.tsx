import Link from "next/link"
import { Activity } from "lucide-react"
import { ClinicalDisclaimer } from "./clinical-disclaimer"

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80 sm:px-6">
      <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-clinical-primary text-clinical-primary-foreground">
          <Activity className="h-4 w-4" aria-hidden="true" />
        </span>
        <span>ResistAI</span>
      </Link>
      <div className="ml-auto hidden sm:block">
        <ClinicalDisclaimer variant="compact" />
      </div>
    </header>
  )
}
