import { getDb } from "./client"
import type {
  CounterfactualScenario,
  PatientRiskAssessment,
  PatientSummary,
  RiskBand,
} from "@/lib/types"

interface PatientRow {
  id: string
  display_name: string
  infection_context: string
  organism: string | null
  transfer_patient: boolean
  evidence_completeness: number
  confidence: "low" | "medium" | "high"
  highest_risk_band: RiskBand | null
  external_data_available: boolean
}

function mapPatientRow(row: PatientRow): PatientSummary {
  return {
    id: row.id,
    displayName: row.display_name,
    infectionContext: row.infection_context,
    organism: row.organism ?? undefined,
    transferPatient: row.transfer_patient,
    evidenceCompleteness: row.evidence_completeness,
    confidence: row.confidence,
    highestRiskBand: row.highest_risk_band ?? undefined,
    externalDataAvailable: row.external_data_available,
  }
}

export async function dbListPatients(): Promise<PatientSummary[]> {
  const sql = getDb()
  if (!sql) return []

  const rows = await sql<PatientRow[]>`
    select id, display_name, infection_context, organism, transfer_patient,
           evidence_completeness, confidence, highest_risk_band, external_data_available
    from patients
    order by (id::int)
  `
  return rows.map(mapPatientRow)
}

export async function dbGetPatientSummary(patientId: string): Promise<PatientSummary | undefined> {
  const sql = getDb()
  if (!sql) return undefined

  const rows = await sql<PatientRow[]>`
    select id, display_name, infection_context, organism, transfer_patient,
           evidence_completeness, confidence, highest_risk_band, external_data_available
    from patients
    where id = ${patientId}
    limit 1
  `
  return rows[0] ? mapPatientRow(rows[0]) : undefined
}

export async function dbGetActiveAssessment(
  patientId: string
): Promise<PatientRiskAssessment | undefined> {
  const sql = getDb()
  if (!sql) return undefined

  const rows = await sql<{ payload: PatientRiskAssessment }[]>`
    select payload from assessments
    where patient_id = ${patientId} and is_active = true
    limit 1
  `
  return rows[0]?.payload
}

export async function dbGetCounterfactualScenarios(
  patientId: string
): Promise<CounterfactualScenario[]> {
  const sql = getDb()
  if (!sql) return []

  const rows = await sql<{ payload: CounterfactualScenario[] }[]>`
    select payload from counterfactual_scenarios where patient_id = ${patientId} limit 1
  `
  return rows[0]?.payload ?? []
}

/**
 * Applies external history by flipping the active assessment version for a
 * patient to the next one (e.g. Patient #10's pre-seeded v2 "after" row).
 * Returns the newly active assessment, or undefined if there is no next
 * version to apply (already latest, or patient not found).
 */
export async function dbApplyExternalHistory(
  patientId: string
): Promise<PatientRiskAssessment | undefined> {
  const sql = getDb()
  if (!sql) return undefined

  return sql.begin(async (tx) => {
    const current = await tx<{ id: string; version: number }[]>`
      select id, version from assessments
      where patient_id = ${patientId} and is_active = true
      limit 1
    `
    if (!current[0]) return undefined

    const next = await tx<{ id: string; payload: PatientRiskAssessment }[]>`
      select id, payload from assessments
      where patient_id = ${patientId} and version = ${current[0].version + 1}
      limit 1
    `
    if (!next[0]) return undefined

    await tx`update assessments set is_active = false where id = ${current[0].id}`
    await tx`update assessments set is_active = true where id = ${next[0].id}`

    return next[0].payload
  })
}
