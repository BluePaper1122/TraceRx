import { NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"
import type { ExplainResponse, PatientRiskAssessment } from "@/lib/types"
import { retrieveRelevantChunks } from "@/lib/rag/retrieve"
import type { RagChunk } from "@/lib/rag/corpus"
import { explainRequestSchema, explainResponseSchema, modelOutputSchema } from "@/lib/ai/schemas"

export const runtime = "nodejs"

const MODEL = "llama-3.3-70b-versatile"

function buildSystemPrompt() {
  return `You are the Clinical Evidence Assistant inside ResistAI, a synthetic-data
research prototype for antimicrobial resistance-risk intelligence.

You explain a deterministic assessment that has ALREADY been computed by a
separate scoring engine. You do not calculate, adjust, or estimate any risk
score, probability, or percentage. You do not diagnose infection. You do not
recommend a treatment or antibiotic. You do not recommend dosing. You do not
answer general medical questions unrelated to the provided assessment JSON
and retrieved reference material — if asked something outside that scope,
say plainly that it is outside what this assessment supports.

You are given two kinds of grounding material:
1. "assessment" — the authoritative, already-computed patient-specific
   evidence and score. Treat this as ground truth about the patient.
2. "referenceMaterial" — supporting knowledge chunks (AMR guidance, the
   project's scoring methodology, antibiograms, safety rules) retrieved for
   this question. Use these only for general/methodology context, never as a
   substitute for or override of the patient-specific "assessment" data.

Never mix an antibiogram chunk belonging to one institution with another
institution's data as if they were the same source.

Only use facts present in "assessment" or "referenceMaterial". If information
is marked "unavailable", "not_tested", or "pending", say plainly that it is
not available — never imply it is negative or reassuring. If neither the
assessment nor the retrieved reference material supports an answer, say the
available evidence is insufficient rather than guessing.

Respond ONLY with a JSON object of this exact shape:
{
  "title": string,
  "summary": string (2-4 sentences),
  "points": string[] (2-5 short bullet points),
  "sources": [{ "id": string, "label": string, "type": string }]
}

"sources" must be drawn only from the evidence entries, timeline events, or
baseline sources inside "assessment", and/or the "id"/"sourceLabel" values of
chunks inside "referenceMaterial" — cite only ones you actually used. Keep
language plain, clinical, and neutral.`
}

function formatReferenceMaterial(chunks: RagChunk[]) {
  return chunks.map((c) => ({
    id: c.id,
    title: c.title,
    section: c.section,
    sourceLabel: c.sourceLabel,
    institution: c.institution,
    content: c.content,
  }))
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: "Clinical Evidence Assistant is not configured (missing GROQ_API_KEY)." },
      { status: 503 }
    )
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const parsedRequest = explainRequestSchema.safeParse(json)
  if (!parsedRequest.success) {
    return NextResponse.json(
      { error: "A question and the current assessment are required." },
      { status: 400 }
    )
  }
  const body = parsedRequest.data

  try {
    const assessment = body.assessment as unknown as PatientRiskAssessment

    const institutions = new Set<string>()
    for (const drug of assessment.drugs) {
      for (const evidence of drug.evidence) {
        if (evidence.provenance?.institution) institutions.add(evidence.provenance.institution)
      }
    }
    for (const event of assessment.timeline) {
      if (event.sourceInstitution) institutions.add(event.sourceInstitution)
    }

    const referenceChunks = retrieveRelevantChunks(body.question, {
      organism: assessment.context.organism,
      syndrome: assessment.context.syndrome,
      drugNames: assessment.drugs.map((d) => d.drug),
      institutions: [...institutions],
    })

    const client = new Groq({ apiKey })

    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt() },
        {
          role: "user",
          content: JSON.stringify({
            question: body.question,
            assessment,
            referenceMaterial: formatReferenceMaterial(referenceChunks),
          }),
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) throw new Error("Empty response from model")

    const parsedModelOutput = modelOutputSchema.safeParse(JSON.parse(raw))
    if (!parsedModelOutput.success) {
      throw new Error("Malformed response from model: " + parsedModelOutput.error.message)
    }

    const finalResponse = explainResponseSchema.parse({
      ...parsedModelOutput.data,
      retrievedReferences: referenceChunks.map((c) => ({
        id: c.id,
        title: c.title,
        sourceLabel: c.sourceLabel,
      })),
    })

    return NextResponse.json(finalResponse satisfies ExplainResponse)
  } catch (err) {
    console.error("[/api/explain]", err)
    return NextResponse.json(
      { error: "Evidence explanation unavailable. The deterministic assessment remains available." },
      { status: 502 }
    )
  }
}
