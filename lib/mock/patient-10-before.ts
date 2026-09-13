import type { PatientRiskAssessment } from "@/lib/types"

/**
 * Synthetic Patient #10 — initial state at arrival, before external
 * history has been retrieved. Intentionally low-confidence, not "safe":
 * the low scores here reflect missing evidence, not a benign patient.
 */
export const patient10Before: PatientRiskAssessment = {
  patientId: "10",
  generatedAt: "2026-09-12T09:14:00Z",

  context: {
    syndrome: "Suspected UTI",
    organism: "E. coli",
    unit: "Emergency Department",
  },

  evidenceCompleteness: 24,
  confidence: "low",

  availability: {
    priorCultures: "unavailable",
    colonization: "unavailable",
    antibioticExposure: "unavailable",
    localAntibiogram: "positive",
    externalHistory: "unavailable",
  },

  drugs: [
    {
      id: "ceftriaxone",
      drug: "Ceftriaxone",
      abbreviation: "CRO",
      prototypeScore: 22,
      riskBand: "low",
      confidence: "low",
      baseline: {
        probability: 21,
        source: "Local hospital antibiogram",
      },
      evidence: [
        {
          id: "cro-baseline",
          type: "antibiogram",
          label: "Local antibiogram baseline",
          description: "Population-level E. coli susceptibility, this unit",
          strength: "moderate",
          direction: "neutral",
          contribution: 21,
          provenance: {
            institution: "Current hospital",
            verified: true,
            resourceType: "Antibiogram",
          },
        },
      ],
    },
    {
      id: "ciprofloxacin",
      drug: "Ciprofloxacin",
      abbreviation: "CIP",
      prototypeScore: 31,
      riskBand: "moderate",
      confidence: "low",
      baseline: {
        probability: 29,
        source: "Local hospital antibiogram",
      },
      evidence: [
        {
          id: "cip-baseline",
          type: "antibiogram",
          label: "Local antibiogram baseline",
          description: "Population-level E. coli susceptibility, this unit",
          strength: "moderate",
          direction: "neutral",
          contribution: 29,
          provenance: {
            institution: "Current hospital",
            verified: true,
            resourceType: "Antibiogram",
          },
        },
      ],
    },
    {
      id: "meropenem",
      drug: "Meropenem",
      abbreviation: "MEM",
      prototypeScore: 14,
      riskBand: "low",
      confidence: "low",
      baseline: {
        probability: 14,
        source: "Local hospital antibiogram",
      },
      evidence: [
        {
          id: "mem-baseline",
          type: "antibiogram",
          label: "Local antibiogram baseline",
          description: "Population-level E. coli susceptibility, this unit",
          strength: "moderate",
          direction: "neutral",
          contribution: 14,
          provenance: {
            institution: "Current hospital",
            verified: true,
            resourceType: "Antibiogram",
          },
        },
      ],
    },
  ],

  timeline: [
    {
      id: "evt-current-uti",
      type: "infection",
      title: "Current suspected UTI",
      description: "Presented to Emergency Department",
      occurredAt: "2026-09-12T09:00:00Z",
      sourceInstitution: "Current hospital",
      verified: true,
    },
  ],

  safetyWarnings: [
    "External hospital records have not been retrieved. Prior culture, colonization, and recent antibiotic history are currently unavailable.",
    "Unavailable data is not interpreted as negative evidence.",
  ],
}
