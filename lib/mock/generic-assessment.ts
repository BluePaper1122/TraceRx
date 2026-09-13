import type {
  DrugRiskAssessment,
  EvidenceAvailability,
  PatientRiskAssessment,
  PatientSummary,
  RiskBand,
} from "@/lib/types"

/**
 * Deterministically derives a placeholder assessment shape for roster
 * patients that don't yet have a hand-authored fixture. This does not
 * calculate clinical risk — it only maps the summary's stored fields
 * into a display-compatible structure so /patients/[id] always renders.
 */
export function buildGenericAssessment(summary: PatientSummary): PatientRiskAssessment {
  const band: RiskBand = summary.highestRiskBand ?? "low"
  const availabilityFor = (present: boolean): EvidenceAvailability =>
    present ? "positive" : "unavailable"

  const drugs: DrugRiskAssessment[] = STANDARD_PANEL.map((drug, i) => {
    const score = scoreForBand(band, i)
    return {
      id: drug.id,
      drug: drug.name,
      abbreviation: drug.abbreviation,
      prototypeScore: score,
      riskBand: bandFromScore(score),
      confidence: summary.confidence,
      baseline: {
        probability: Math.max(8, score - 10),
        source: "Local hospital antibiogram",
      },
      evidence: [
        {
          id: `${drug.id}-baseline`,
          type: "antibiogram",
          label: "Local antibiogram baseline",
          description: "Population-level susceptibility, this unit",
          strength: "moderate",
          direction: "neutral",
          contribution: Math.max(8, score - 10),
          provenance: {
            institution: "Current hospital",
            verified: true,
            resourceType: "Antibiogram",
          },
        },
      ],
    }
  })

  return {
    patientId: summary.id,
    generatedAt: new Date().toISOString(),
    context: {
      syndrome: summary.infectionContext,
      organism: summary.organism,
    },
    evidenceCompleteness: summary.evidenceCompleteness,
    confidence: summary.confidence,
    drugs,
    availability: {
      priorCultures: availabilityFor(summary.evidenceCompleteness > 50),
      colonization: summary.evidenceCompleteness > 70 ? "negative" : "not_tested",
      antibioticExposure: availabilityFor(summary.evidenceCompleteness > 40),
      localAntibiogram: "positive",
      externalHistory: availabilityFor(summary.externalDataAvailable),
    },
    timeline: [
      {
        id: "evt-current",
        type: "infection",
        title: summary.infectionContext,
        description: "Current presentation",
        occurredAt: new Date().toISOString(),
        sourceInstitution: "Current hospital",
        verified: true,
      },
    ],
    safetyWarnings: summary.externalDataAvailable
      ? []
      : [
          "External hospital records have not been retrieved. Some prior history may be unavailable.",
          "Unavailable data is not interpreted as negative evidence.",
        ],
  }
}

const STANDARD_PANEL = [
  { id: "ceftriaxone", name: "Ceftriaxone", abbreviation: "CRO" },
  { id: "ciprofloxacin", name: "Ciprofloxacin", abbreviation: "CIP" },
  { id: "meropenem", name: "Meropenem", abbreviation: "MEM" },
]

function scoreForBand(band: RiskBand, index: number): number {
  const base = band === "high" ? 70 : band === "moderate" ? 42 : 18
  return Math.max(5, base - index * 8)
}

function bandFromScore(score: number): RiskBand {
  if (score >= 60) return "high"
  if (score >= 35) return "moderate"
  return "low"
}
