import { NextRequest, NextResponse } from "next/server"
import { applyExternalHistory } from "@/lib/api/patients"
import { isDatabaseConfigured } from "@/lib/db/client"
import { patient10VerifiedAssessment } from "@/lib/adapters/assessment-adapter"

export const runtime = "nodejs"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params

  if (isDatabaseConfigured()) {
    const updated = await applyExternalHistory(patientId)
    if (updated) {
      return NextResponse.json(updated)
    }
    return NextResponse.json(
      {
        error: {
          code: "EXTERNAL_HISTORY_NOT_FOUND",
          message: "No verified external history is available to apply for this patient.",
        },
      },
      { status: 404 }
    )
  }

  // No database configured yet — fall back to the demo fixture so Patient
  // #10's flow keeps working while a real Supabase connection is wired in.
  if (patientId === "10") {
    return NextResponse.json(patient10VerifiedAssessment)
  }

  return NextResponse.json(
    {
      error: {
        code: "EXTERNAL_HISTORY_NOT_FOUND",
        message: "No verified external history is available to apply for this patient.",
      },
    },
    { status: 404 }
  )
}
