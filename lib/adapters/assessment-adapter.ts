import type {
  CounterfactualScenario,
  PatientRiskAssessment,
  PatientSummary,
} from "@/lib/types"
import { patients } from "@/lib/mock/patients"
import { patient10Before } from "@/lib/mock/patient-10-before"
import {
  patient10After,
  patient10CounterfactualScenarios,
} from "@/lib/mock/patient-10-after"
import { buildGenericAssessment } from "@/lib/mock/generic-assessment"
import { isDatabaseConfigured } from "@/lib/db/client"
import {
  dbApplyExternalHistory,
  dbGetActiveAssessment,
  dbGetCounterfactualScenarios,
  dbGetPatientSummary,
  dbListPatients,
} from "@/lib/db/queries"

/**
 * This is the single seam between the frontend and the backend. Every
 * function here returns exactly the JSON shape the UI expects. When
 * DATABASE_URL is configured (a real Supabase Postgres connection), reads
 * and the external-history mutation go through Postgres. Otherwise — or if
 * a query unexpectedly fails — it falls back to the in-repo fixtures so a
 * database outage never breaks the demo mid-judging.
 */
export interface AssessmentAdapter {
  listPatients(): Promise<PatientSummary[]>
  getPatientSummary(patientId: string): Promise<PatientSummary | undefined>
  getAssessment(patientId: string): Promise<PatientRiskAssessment>
  getCounterfactualScenarios(patientId: string): Promise<CounterfactualScenario[]>
  applyExternalHistory(patientId: string): Promise<PatientRiskAssessment | undefined>
}

const mockAdapter: Pick<
  AssessmentAdapter,
  "listPatients" | "getPatientSummary" | "getAssessment" | "getCounterfactualScenarios"
> = {
  async listPatients() {
    return patients
  },

  async getPatientSummary(patientId: string) {
    return patients.find((p) => p.id === patientId)
  },

  async getAssessment(patientId: string) {
    if (patientId === "10") return patient10Before
    const summary = patients.find((p) => p.id === patientId)
    if (!summary) {
      throw new Error(`Unknown patient: ${patientId}`)
    }
    return buildGenericAssessment(summary)
  },

  async getCounterfactualScenarios(patientId: string) {
    if (patientId === "10") return patient10CounterfactualScenarios
    return []
  },
}

function warnFallback(op: string, err: unknown) {
  console.warn(`[assessment-adapter] ${op} falling back to mock data:`, err)
}

export const assessmentAdapter: AssessmentAdapter = {
  async listPatients() {
    if (!isDatabaseConfigured()) return mockAdapter.listPatients()
    try {
      const rows = await dbListPatients()
      return rows.length > 0 ? rows : mockAdapter.listPatients()
    } catch (err) {
      warnFallback("listPatients", err)
      return mockAdapter.listPatients()
    }
  },

  async getPatientSummary(patientId: string) {
    if (!isDatabaseConfigured()) return mockAdapter.getPatientSummary(patientId)
    try {
      const row = await dbGetPatientSummary(patientId)
      return row ?? mockAdapter.getPatientSummary(patientId)
    } catch (err) {
      warnFallback("getPatientSummary", err)
      return mockAdapter.getPatientSummary(patientId)
    }
  },

  async getAssessment(patientId: string) {
    if (!isDatabaseConfigured()) return mockAdapter.getAssessment(patientId)
    try {
      const assessment = await dbGetActiveAssessment(patientId)
      return assessment ?? (await mockAdapter.getAssessment(patientId))
    } catch (err) {
      warnFallback("getAssessment", err)
      return mockAdapter.getAssessment(patientId)
    }
  },

  async getCounterfactualScenarios(patientId: string) {
    if (!isDatabaseConfigured()) return mockAdapter.getCounterfactualScenarios(patientId)
    try {
      const scenarios = await dbGetCounterfactualScenarios(patientId)
      return scenarios.length > 0 ? scenarios : mockAdapter.getCounterfactualScenarios(patientId)
    } catch (err) {
      warnFallback("getCounterfactualScenarios", err)
      return mockAdapter.getCounterfactualScenarios(patientId)
    }
  },

  async applyExternalHistory(patientId: string) {
    if (!isDatabaseConfigured()) return undefined
    try {
      return await dbApplyExternalHistory(patientId)
    } catch (err) {
      warnFallback("applyExternalHistory", err)
      return undefined
    }
  },
}

/** Exposed for the client: the verified post-retrieval fixture, used when no database is configured. */
export const patient10VerifiedAssessment: PatientRiskAssessment = patient10After
