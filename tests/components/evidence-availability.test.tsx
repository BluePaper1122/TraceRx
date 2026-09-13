import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { AvailabilityBadge } from "@/components/shared/badges"
import { EVIDENCE_AVAILABILITY_LABEL } from "@/lib/utils/risk"
import type { EvidenceAvailability } from "@/lib/types"

describe("AvailabilityBadge", () => {
  it("renders unavailable distinctly from negative", () => {
    const { rerender } = render(<AvailabilityBadge status="unavailable" />)
    expect(screen.getByText("UNAVAILABLE")).toBeInTheDocument()

    rerender(<AvailabilityBadge status="negative" />)
    expect(screen.getByText("NEGATIVE")).toBeInTheDocument()
    expect(screen.queryByText("UNAVAILABLE")).not.toBeInTheDocument()
  })

  it("renders not_tested distinctly from unavailable and negative", () => {
    render(<AvailabilityBadge status="not_tested" />)
    expect(screen.getByText("NOT TESTED")).toBeInTheDocument()
  })

  it("gives every one of the five states its own label", () => {
    const statuses = Object.keys(EVIDENCE_AVAILABILITY_LABEL) as EvidenceAvailability[]
    expect(statuses).toHaveLength(5)

    const renderedLabels = statuses.map((status) => {
      const { unmount, container } = render(<AvailabilityBadge status={status} />)
      const text = container.textContent
      unmount()
      return text
    })

    expect(new Set(renderedLabels).size).toBe(5)
  })
})
