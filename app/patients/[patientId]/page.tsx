import { notFound } from "next/navigation"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { PatientDashboard } from "@/components/dashboard/patient-dashboard"
import { getPatientAssessment, getPatientSummary, getCounterfactualScenarios } from "@/lib/api/patients"
import { patient10VerifiedAssessment } from "@/lib/adapters/assessment-adapter"

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>
}) {
  const { patientId } = await params
  const patient = await getPatientSummary(patientId)
  if (!patient) notFound()

  const assessment = await getPatientAssessment(patientId)
  const isDemoPatient = patientId === "10"
  const counterfactualScenarios = await getCounterfactualScenarios(patientId)

  return (
    <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/patients">Patients</Link>} />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{patient.displayName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PatientDashboard
        patient={patient}
        initialAssessment={assessment}
        afterAssessment={isDemoPatient ? patient10VerifiedAssessment : undefined}
        counterfactualScenarios={counterfactualScenarios}
        isDemoPatient={isDemoPatient}
      />
    </div>
  )
}
