import { cn } from "@/lib/utils"
import type { EvidenceAvailability, RiskBand } from "@/lib/types"
import {
  EVIDENCE_AVAILABILITY_LABEL,
  EVIDENCE_AVAILABILITY_SYMBOL,
  EVIDENCE_AVAILABILITY_TOKEN,
  RISK_BAND_LABEL,
  RISK_BAND_SYMBOL,
  RISK_BAND_TOKEN,
  SUSCEPTIBILITY_LABEL,
} from "@/lib/utils/risk"

export function RiskBadge({
  band,
  score,
  className,
}: {
  band: RiskBand
  score?: number
  className?: string
}) {
  const token = RISK_BAND_TOKEN[band]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        token.text,
        token.bg,
        token.border,
        className
      )}
    >
      <span aria-hidden="true">{RISK_BAND_SYMBOL[band]}</span>
      <span>{RISK_BAND_LABEL[band].toUpperCase()}</span>
      {score !== undefined && <span className="font-semibold">{Math.round(score)}%</span>}
    </span>
  )
}

export function AvailabilityBadge({
  status,
  className,
}: {
  status: EvidenceAvailability
  className?: string
}) {
  const token = EVIDENCE_AVAILABILITY_TOKEN[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        token.text,
        token.bg,
        token.border,
        className
      )}
    >
      <span aria-hidden="true" className="font-mono">
        {EVIDENCE_AVAILABILITY_SYMBOL[status]}
      </span>
      <span>{EVIDENCE_AVAILABILITY_LABEL[status].toUpperCase()}</span>
    </span>
  )
}

export function SusceptibilityChip({ result }: { result: "S" | "I" | "R" }) {
  const styles: Record<"S" | "I" | "R", string> = {
    S: "text-risk-low bg-risk-low-bg border-risk-low-border",
    I: "text-risk-moderate bg-risk-moderate-bg border-risk-moderate-border",
    R: "text-risk-high bg-risk-high-bg border-risk-high-border",
  }
  return (
    <span
      title={SUSCEPTIBILITY_LABEL[result]}
      className={cn(
        "inline-flex h-6 w-6 items-center justify-center rounded border text-xs font-semibold",
        styles[result]
      )}
    >
      <span className="sr-only">{SUSCEPTIBILITY_LABEL[result]}</span>
      <span aria-hidden="true">{result}</span>
    </span>
  )
}

export function ConfidencePill({
  level,
  className,
}: {
  level: "low" | "medium" | "high"
  className?: string
}) {
  const styles: Record<"low" | "medium" | "high", string> = {
    high: "text-verified bg-verified-bg border-verified-border",
    medium: "text-risk-moderate bg-risk-moderate-bg border-risk-moderate-border",
    low: "text-data-missing bg-data-missing-bg border-data-missing-border",
  }
  const label: Record<"low" | "medium" | "high", string> = {
    high: "HIGH CONFIDENCE",
    medium: "MEDIUM CONFIDENCE",
    low: "LOW CONFIDENCE",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold tracking-wide",
        styles[level],
        className
      )}
    >
      {label[level]}
    </span>
  )
}
