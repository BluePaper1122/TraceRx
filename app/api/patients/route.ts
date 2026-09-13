import { NextResponse } from "next/server"
import { getPatients } from "@/lib/api/patients"

export const runtime = "nodejs"

export async function GET() {
  const patients = await getPatients()
  return NextResponse.json(patients)
}
