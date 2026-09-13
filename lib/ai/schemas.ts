import { z } from "zod"

export const explainRequestSchema = z.object({
  patientId: z.string().min(1),
  question: z.string().min(1).max(500),
  assessment: z.object({
    patientId: z.string(),
    generatedAt: z.string(),
    context: z.object({
      syndrome: z.string(),
      organism: z.string().optional(),
      unit: z.string().optional(),
    }),
    evidenceCompleteness: z.number(),
    confidence: z.enum(["low", "medium", "high"]),
    drugs: z.array(z.record(z.string(), z.unknown())),
    availability: z.record(z.string(), z.unknown()),
    timeline: z.array(z.record(z.string(), z.unknown())),
    safetyWarnings: z.array(z.string()),
  }),
})

/** What we require directly from the model's own JSON output. */
export const modelOutputSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  points: z.array(z.string()).max(8),
  sources: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        type: z.string(),
      })
    )
    .default([]),
})

/** The full API response, after the server attaches the retrieved RAG chunks. */
export const explainResponseSchema = modelOutputSchema.extend({
  retrievedReferences: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        sourceLabel: z.string(),
      })
    )
    .optional(),
})
