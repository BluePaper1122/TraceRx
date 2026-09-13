import type {
  ConfidenceLevel,
  EvidenceAvailability,
  EvidenceContribution,
  RiskBand,
  SusceptibilityRecord,
} from "./evidence"

export interface DrugRiskAssessment {
  id: string
  drug: string
  abbreviation?: string
  prototypeScore: number
  riskBand: RiskBand
  confidence: ConfidenceLevel
  baseline: {
    probability: number
    source: string
  }
  evidence: EvidenceContribution[]
}

export type TimelineEventType =
  | "infection"
  | "culture"
  | "colonization"
  | "antibiotic"
  | "transfer"

export interface TimelineEvent {
  id: string
  type: TimelineEventType
  title: string
  description?: string
  occurredAt: string
  sourceInstitution?: string
  verified?: boolean
  fhirResourceType?: string
  recordHash?: string
  susceptibility?: SusceptibilityRecord[]
}

export interface EvidenceAvailabilityMap {
  priorCultures: EvidenceAvailability
  colonization: EvidenceAvailability
  antibioticExposure: EvidenceAvailability
  localAntibiogram: EvidenceAvailability
  externalHistory: EvidenceAvailability
}

export interface PatientRiskAssessment {
  patientId: string
  generatedAt: string

  context: {
    syndrome: string
    organism?: string
    unit?: string
  }

  evidenceCompleteness: number
  confidence: ConfidenceLevel

  drugs: DrugRiskAssessment[]

  availability: EvidenceAvailabilityMap

  timeline: TimelineEvent[]

  safetyWarnings: string[]
}

export interface CounterfactualScenario {
  id: string
  label: string
  description?: string
  excludedEvidenceTypes: string[]
  drugs: {
    drugId: string
    prototypeScore: number
    riskBand: RiskBand
  }[]
}
