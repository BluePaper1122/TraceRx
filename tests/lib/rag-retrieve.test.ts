import { describe, expect, it } from "vitest"
import { retrieveRelevantChunks } from "@/lib/rag/retrieve"

describe("retrieveRelevantChunks", () => {
  it("retrieves relevant AMR guidance and antibiogram chunks for a UTI question", () => {
    const results = retrieveRelevantChunks(
      "Why does recent antibiotic exposure matter for ceftriaxone?",
      { organism: "E. coli", syndrome: "Suspected UTI", drugNames: ["Ceftriaxone"], institutions: ["Current hospital"] }
    )

    expect(results.length).toBeGreaterThan(0)
    expect(results.some((r) => r.documentType === "amr_guidance" || r.documentType === "scoring_methodology")).toBe(
      true
    )
  })

  it("does not surface an antibiogram from an institution outside the assessment's context", () => {
    const results = retrieveRelevantChunks(
      "What does the local antibiogram say about ceftriaxone resistance?",
      { organism: "E. coli", syndrome: "Suspected UTI", institutions: ["Current hospital"] }
    )

    const houstonChunk = results.find((r) => r.institution === "Houston General")
    expect(houstonChunk).toBeUndefined()
  })

  it("returns nothing for an unrelated query with no keyword overlap", () => {
    const results = retrieveRelevantChunks("xyzzy plugh quux", {})
    expect(results).toHaveLength(0)
  })
})
