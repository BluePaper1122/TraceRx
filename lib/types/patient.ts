import type { ConfidenceLevel, RiskBand } from "./evidence"

export interface PatientSummary {
  id: string
  displayName: string
  infectionContext: string
  organism?: string
  transferPatient: boolean
  evidenceCompleteness: number
  confidence: ConfidenceLevel
  highestRiskBand?: RiskBand
  externalDataAvailable: boolean
}
