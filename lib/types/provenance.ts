export interface ProvenanceRecord {
  id: string
  label: string
  institution: string
  fhirResourceType: string
  fingerprint: string
  recordedAt: string
  verified: boolean
  integrity: "valid" | "unverified" | "mismatch"
}

export type RetrievalStepStatus = "pending" | "in_progress" | "complete" | "error"

export interface RetrievalStep {
  id: string
  label: string
  detail?: string
  status: RetrievalStepStatus
}
