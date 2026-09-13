import type { PatientRiskAssessment } from "./assessment"

export interface ExplainSource {
  id: string
  label: string
  type: string
}

export interface RetrievedReference {
  id: string
  title: string
  sourceLabel: string
}

export interface ExplainResponse {
  title: string
  summary: string
  points: string[]
  sources: ExplainSource[]
  /** All reference-corpus chunks retrieved for this question, regardless of which the model cited. */
  retrievedReferences?: RetrievedReference[]
}

export interface ExplainRequest {
  patientId: string
  question: string
  /** The client's current deterministic assessment — the assistant explains this, and only this. */
  assessment: PatientRiskAssessment
}
