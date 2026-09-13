export type RiskBand = "low" | "moderate" | "high"

export type ConfidenceLevel = "low" | "medium" | "high"

/**
 * The five evidence states. Never collapse to boolean — "unavailable" and
 * "not_tested" must never be interpreted as "negative".
 */
export type EvidenceAvailability =
  | "positive"
  | "negative"
  | "not_tested"
  | "unavailable"
  | "pending"

export type EvidenceStrength = "weak" | "moderate" | "strong" | "very_strong"

export type EvidenceDirection = "increase" | "decrease" | "neutral"

export type EvidenceType =
  | "prior_ast"
  | "colonization"
  | "antibiotic_exposure"
  | "antibiogram"

export interface EvidenceProvenance {
  institution: string
  verified: boolean
  hash?: string
  resourceType?: string
}

export interface EvidenceContribution {
  id: string
  type: EvidenceType
  label: string
  description?: string
  observedAt?: string
  daysAgo?: number
  strength: EvidenceStrength
  direction: EvidenceDirection
  contribution?: number
  provenance?: EvidenceProvenance
}

export type SusceptibilityResult = "S" | "I" | "R"

export interface SusceptibilityRecord {
  antibiotic: string
  result: SusceptibilityResult
}
