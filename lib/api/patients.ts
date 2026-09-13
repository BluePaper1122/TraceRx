import { assessmentAdapter } from "@/lib/adapters/assessment-adapter"

export const getPatients = assessmentAdapter.listPatients
export const getPatientSummary = assessmentAdapter.getPatientSummary
export const getPatientAssessment = assessmentAdapter.getAssessment
export const getCounterfactualScenarios = assessmentAdapter.getCounterfactualScenarios
export const applyExternalHistory = assessmentAdapter.applyExternalHistory
