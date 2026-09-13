export interface RagChunk {
  id: string
  title: string
  section: string
  documentType: "amr_guidance" | "scoring_methodology" | "antibiogram" | "safety_rules"
  sourceLabel: string
  institution?: string
  tags: {
    organism?: string[]
    drug?: string[]
    syndrome?: string[]
  }
  content: string
}

/**
 * Curated reference corpus for the Clinical Evidence Assistant.
 *
 * This is NOT patient data — patient evidence and the computed assessment are
 * always loaded directly from the assessment JSON the client sends. This
 * corpus is only the supporting knowledge (guidance, methodology,
 * antibiograms, safety rules) that grounds the assistant's explanation
 * without letting it invent claims. Retrieval is plain keyword overlap —
 * no vector DB or embedding service — which is a legitimate lightweight RAG
 * pattern for a small, fixed, curated document set.
 */
export const RAG_CORPUS: RagChunk[] = [
  {
    id: "amr-guidance-uti",
    title: "AMR Guidance Summary — Suspected UTI / Gram-negative bacteremia",
    section: "Empiric risk factors",
    documentType: "amr_guidance",
    sourceLabel: "Approved AMR guidance excerpt",
    tags: { organism: ["E. coli", "Klebsiella pneumoniae"], syndrome: ["Suspected UTI", "Suspected bacteremia"] },
    content:
      "Recognized risk factors for resistant Enterobacterales include prior isolation of a resistant organism " +
      "(especially within the last 90-180 days), known ESBL or carbapenemase colonization, recent beta-lactam or " +
      "fluoroquinolone exposure (particularly within the prior 30 days), recent healthcare exposure, and " +
      "inter-facility transfer. No single factor is determinative; these are used to adjust suspicion relative to " +
      "the local antibiogram baseline, not to replace culture-directed therapy once results are available.",
  },
  {
    id: "amr-guidance-missing-data",
    title: "AMR Guidance Summary — Handling incomplete history",
    section: "Missing information",
    documentType: "amr_guidance",
    sourceLabel: "Approved AMR guidance excerpt",
    tags: {},
    content:
      "When prior culture, colonization, or exposure history is unavailable — for example immediately after an " +
      "inter-facility transfer — clinicians should treat the absence of a record as absence of information, not as " +
      "evidence of a negative result. Confidence in any risk estimate should be explicitly lowered when source " +
      "records have not yet been retrieved, rather than defaulting to a reassuring low-risk assumption.",
  },
  {
    id: "scoring-methodology-overview",
    title: "ResistAI Scoring Methodology",
    section: "Evidence pipeline overview",
    documentType: "scoring_methodology",
    sourceLabel: "Project scoring methodology (prototype)",
    tags: {},
    content:
      "The ResistAI prototype signal starts from the local antibiogram baseline for the organism and syndrome, " +
      "then layers patient-specific evidence in order of strength: a prior culture with susceptibility results for " +
      "the same organism is the strongest single signal; documented colonization with a resistant organism is the " +
      "next strongest; recent antibiotic exposure is generally treated as supporting/correlated evidence rather " +
      "than a fully independent signal when it overlaps with a already-resistant prior isolate, to avoid double-" +
      "counting the same underlying resistance story. Older evidence is weighted less heavily over time (decay) " +
      "but is never deleted or hidden from the evidence chain.",
  },
  {
    id: "scoring-methodology-confidence",
    title: "ResistAI Scoring Methodology",
    section: "Confidence and evidence completeness",
    documentType: "scoring_methodology",
    sourceLabel: "Project scoring methodology (prototype)",
    tags: {},
    content:
      "Evidence completeness and confidence are tracked separately from the resistance-risk signal itself. " +
      "Completeness measures how many of the four evidence categories (prior cultures, colonization, recent " +
      "antibiotic exposure, local antibiogram) are actually available for this patient. Confidence reflects how " +
      "reliable the assessment is given what has been verified. A low score can still carry low confidence if " +
      "little evidence exists yet — that combination means 'insufficient information', not 'low risk'.",
  },
  {
    id: "antibiogram-current-hospital",
    title: "Local Antibiogram — Current Hospital, Emergency Department",
    section: "E. coli susceptibility, urinary isolates",
    documentType: "antibiogram",
    institution: "Current hospital",
    tags: { organism: ["E. coli"], syndrome: ["Suspected UTI"] },
    sourceLabel: "Current hospital antibiogram (synthetic)",
    content:
      "Synthetic unit-level antibiogram for E. coli urinary isolates, current hospital Emergency Department: " +
      "ceftriaxone approximately 21% resistant, ciprofloxacin approximately 29% resistant, " +
      "piperacillin/tazobactam approximately 24% resistant, meropenem approximately 14% resistant. These rates " +
      "represent population-level susceptibility for this unit and organism, not any individual patient's result.",
  },
  {
    id: "antibiogram-houston-general",
    title: "External Antibiogram — Houston General",
    section: "E. coli susceptibility, ESBL-associated isolates",
    documentType: "antibiogram",
    institution: "Houston General",
    tags: { organism: ["E. coli"], syndrome: ["Suspected UTI"] },
    sourceLabel: "Houston General antibiogram (synthetic)",
    content:
      "Synthetic antibiogram excerpt from Houston General for ESBL-associated E. coli isolates: resistance to " +
      "ceftriaxone and ciprofloxacin is substantially elevated relative to non-ESBL isolates, while carbapenem " +
      "(meropenem) susceptibility typically remains high. This context is used only to interpret externally " +
      "retrieved patient-specific culture results, not as a substitute for the current hospital's own baseline.",
  },
  {
    id: "safety-rules-core",
    title: "Project Safety Rules",
    section: "Evidence-state handling",
    documentType: "safety_rules",
    sourceLabel: "Project safety rules",
    tags: {},
    content:
      "The system defines five evidence states: positive, negative, not_tested, unavailable, and pending. These " +
      "must never be collapsed into a boolean. 'Unavailable' and 'not_tested' must never be treated as equivalent " +
      "to a confirmed negative result. Historical positive evidence must remain visible in the timeline even after " +
      "its contribution to the current score has decayed. The assistant must never state or imply that missing " +
      "information means a patient is low-risk.",
  },
  {
    id: "safety-rules-ai-boundary",
    title: "Project Safety Rules",
    section: "AI assistant boundary",
    documentType: "safety_rules",
    sourceLabel: "Project safety rules",
    tags: {},
    content:
      "The Clinical Evidence Assistant explains an already-computed deterministic assessment. It does not " +
      "calculate, adjust, or re-derive any resistance-risk score, risk band, or confidence level. It does not " +
      "diagnose infection, recommend a treatment, or recommend antibiotic dosing. It must decline to answer " +
      "general medical questions unrelated to the supplied assessment and instead state that the question is " +
      "outside what the deterministic assessment supports.",
  },
]
