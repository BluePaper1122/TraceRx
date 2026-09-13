import { NextRequest, NextResponse } from "next/server"
import { getPatientAssessment, getPatientSummary } from "@/lib/api/patients"

export const runtime = "nodejs"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params
  const patient = await getPatientSummary(patientId)

  if (!patient) {
    return NextResponse.json({ error: { code: "PATIENT_NOT_FOUND", message: "No matching patient." } }, { status: 404 })
  }

  const assessment = await getPatientAssessment(patientId)
  return NextResponse.json(assessment)
}
