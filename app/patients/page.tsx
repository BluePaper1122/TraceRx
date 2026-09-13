import Link from "next/link"
import { FlaskConical, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfidencePill } from "@/components/shared/badges"
import { PatientTable } from "@/components/patients/patient-table"
import { getPatients } from "@/lib/api/patients"

export default async function PatientsPage() {
  const patients = await getPatients()
  const patient10 = patients.find((p) => p.id === "10")

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Patients</h1>
        <p className="text-sm text-muted-foreground">Synthetic patient roster · research prototype</p>
      </div>

      {patient10 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-clinical-primary/30 bg-clinical-primary/5 p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-clinical-primary text-clinical-primary-foreground">
              <FlaskConical className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="font-medium">{patient10.displayName}</p>
              <p className="text-sm text-muted-foreground">
                {patient10.infectionContext} · {patient10.organism}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                <span>Evidence {patient10.evidenceCompleteness}%</span>
                <ConfidencePill level={patient10.confidence} />
                <span className="text-data-missing">External history unavailable</span>
              </div>
            </div>
          </div>
          <Button
            className="gap-2"
            nativeButton={false}
            render={
              <Link href="/patients/10">
                Open demo patient
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            }
          />
        </div>
      )}

      <PatientTable patients={patients} />
    </div>
  )
}
