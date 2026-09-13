import { NextRequest, NextResponse } from "next/server"
import { getCounterfactualScenarios } from "@/lib/api/patients"

export const runtime = "nodejs"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params
  const scenarios = await getCounterfactualScenarios(patientId)
  return NextResponse.json(scenarios)
}
