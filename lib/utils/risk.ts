import type {
  ConfidenceLevel,
  EvidenceAvailability,
  EvidenceStrength,
  RiskBand,
} from "@/lib/types"

export const RISK_BAND_LABEL: Record<RiskBand, string> = {
  high: "High risk",
  moderate: "Moderate",
  low: "Lower risk",
}

export const RISK_BAND_SYMBOL: Record<RiskBand, string> = {
  high: "●", // ●
  moderate: "▲", // ▲
  low: "✓", // ✓
}

export const RISK_BAND_TOKEN: Record<
  RiskBand,
  { text: string; bg: string; border: string }
> = {
  high: {
    text: "text-risk-high",
    bg: "bg-risk-high-bg",
    border: "border-risk-high-border",
  },
  moderate: {
    text: "text-risk-moderate",
    bg: "bg-risk-moderate-bg",
    border: "border-risk-moderate-border",
  },
  low: {
    text: "text-risk-low",
    bg: "bg-risk-low-bg",
    border: "border-risk-low-border",
  },
}

export function riskBandFromScore(score: number): RiskBand {
  if (score >= 60) return "high"
  if (score >= 35) return "moderate"
  return "low"
}

export const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
}

export const EVIDENCE_AVAILABILITY_LABEL: Record<EvidenceAvailability, string> = {
  positive: "Positive",
  negative: "Negative",
  not_tested: "Not tested",
  unavailable: "Unavailable",
  pending: "Pending",
}

export const EVIDENCE_AVAILABILITY_SYMBOL: Record<EvidenceAvailability, string> = {
  positive: "+",
  negative: "−", // −
  not_tested: "—", // —
  unavailable: "?",
  pending: "…", // …
}

export const EVIDENCE_AVAILABILITY_TOKEN: Record<
  EvidenceAvailability,
  { text: string; bg: string; border: string }
> = {
  positive: {
    text: "text-risk-high",
    bg: "bg-risk-high-bg",
    border: "border-risk-high-border",
  },
  negative: {
    text: "text-risk-low",
    bg: "bg-risk-low-bg",
    border: "border-risk-low-border",
  },
  not_tested: {
    text: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-border",
  },
  unavailable: {
    text: "text-data-missing",
    bg: "bg-data-missing-bg",
    border: "border-data-missing-border",
  },
  pending: {
    text: "text-clinical-primary",
    bg: "bg-accent",
    border: "border-accent-foreground/20",
  },
}

export const EVIDENCE_STRENGTH_DOTS: Record<EvidenceStrength, number> = {
  weak: 2,
  moderate: 3,
  strong: 4,
  very_strong: 5,
}

export const EVIDENCE_STRENGTH_LABEL: Record<EvidenceStrength, string> = {
  weak: "Weak",
  moderate: "Moderate",
  strong: "Strong",
  very_strong: "Very strong",
}

export const SUSCEPTIBILITY_LABEL: Record<"S" | "I" | "R", string> = {
  S: "Susceptible",
  I: "Intermediate",
  R: "Resistant",
}
