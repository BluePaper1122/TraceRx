import Link from "next/link"
import { Activity, ShieldCheck, Fingerprint, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ClinicalDisclaimer } from "@/components/app-shell/clinical-disclaimer"

const PILLARS = [
  {
    icon: ShieldCheck,
    title: "Explainable",
    description:
      "Every risk signal traces back to a visible chain of patient-specific evidence, not an opaque score.",
  },
  {
    icon: Activity,
    title: "Missing-data aware",
    description:
      "Unavailable and not-tested evidence are never treated as negative — low completeness lowers confidence, not risk.",
  },
  {
    icon: Fingerprint,
    title: "Cross-institution provenance",
    description:
      "External history is retrieved with verified source, timestamp, and record fingerprint attached.",
  },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center gap-2 px-6 font-semibold tracking-tight">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-clinical-primary text-clinical-primary-foreground">
          <Activity className="h-4 w-4" aria-hidden="true" />
        </span>
        ResistAI
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-10 px-6 py-16 text-center">
        <div className="space-y-5">
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            ResistAI
          </h1>
          <p className="text-lg text-muted-foreground text-balance">
            The antibiogram tells you what usually works. ResistAI shows what
            this patient&apos;s history says might not.
          </p>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground text-balance">
            Explainable antimicrobial resistance-risk intelligence that
            combines local susceptibility patterns with patient-specific
            evidence.
          </p>
        </div>

        <Button
          size="lg"
          className="gap-2"
          nativeButton={false}
          render={
            <Link href="/patients/10">
              Launch Clinical Demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        />

        <dl className="grid w-full gap-6 pt-8 text-left sm:grid-cols-3">
          {PILLARS.map((pillar) => (
            <div key={pillar.title} className="space-y-2 rounded-lg border border-border bg-card p-4">
              <dt className="flex items-center gap-2 text-sm font-medium">
                <pillar.icon className="h-4 w-4 text-clinical-primary" aria-hidden="true" />
                {pillar.title}
              </dt>
              <dd className="text-sm text-muted-foreground">{pillar.description}</dd>
            </div>
          ))}
        </dl>
      </main>

      <footer className="border-t border-border px-6 py-4 text-center">
        <ClinicalDisclaimer />
      </footer>
    </div>
  )
}
