import { RAG_CORPUS, type RagChunk } from "./corpus"

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "did", "does", "do", "of", "in", "on", "for",
  "to", "and", "or", "this", "that", "what", "why", "how", "which", "role", "with", "it", "its",
  "as", "at", "by", "be", "been", "has", "have", "had", "not", "than", "then", "so", "still",
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9./%-]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t))
}

export interface RetrievalContext {
  organism?: string
  syndrome?: string
  drugNames?: string[]
  institutions?: string[]
}

function scoreChunk(chunkTokens: string[], queryTokens: string[], boostTokens: string[]): number {
  const chunkSet = new Set(chunkTokens)
  let score = 0
  for (const t of queryTokens) {
    if (chunkSet.has(t)) score += 1
  }
  for (const t of boostTokens) {
    if (chunkSet.has(t)) score += 2
  }
  return score
}

/**
 * Plain keyword retrieval over the curated corpus. No embeddings, no vector
 * store — appropriate for a small (~10 chunk), fixed, curated document set.
 * Kept behind this function so a pgvector/hybrid retriever can replace the
 * implementation later without touching callers.
 */
export function retrieveRelevantChunks(
  question: string,
  context: RetrievalContext,
  limit = 4
): RagChunk[] {
  const queryTokens = tokenize(question)
  const boostTokens = tokenize(
    [context.organism, context.syndrome, ...(context.drugNames ?? []), ...(context.institutions ?? [])]
      .filter(Boolean)
      .join(" ")
  )

  // Hard scope: an antibiogram belonging to one institution must never be
  // surfaced as if it applied to a different institution's assessment. This
  // is a correctness rule, not a ranking preference, so it excludes rather
  // than merely down-weights.
  const candidates = RAG_CORPUS.filter((chunk) => {
    if (chunk.documentType !== "antibiogram" || !chunk.institution) return true
    if (!context.institutions || context.institutions.length === 0) return true
    return context.institutions.includes(chunk.institution)
  })

  const scored = candidates.map((chunk) => {
    const chunkTokens = tokenize(
      [
        chunk.title,
        chunk.section,
        chunk.content,
        ...(chunk.tags.organism ?? []),
        ...(chunk.tags.drug ?? []),
        ...(chunk.tags.syndrome ?? []),
      ].join(" ")
    )

    return { chunk, score: scoreChunk(chunkTokens, queryTokens, boostTokens) }
  })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.chunk)
}
