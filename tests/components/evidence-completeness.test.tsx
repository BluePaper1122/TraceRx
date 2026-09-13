import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { EvidenceCompleteness } from "@/components/dashboard/evidence-completeness"

describe("EvidenceCompleteness", () => {
  it("renders the percentage and confidence for a low-evidence patient", () => {
    render(<EvidenceCompleteness value={24} confidence="low" />)

    expect(screen.getByText("24%")).toBeInTheDocument()
    expect(screen.getByText("LOW CONFIDENCE")).toBeInTheDocument()
    expect(screen.getByText(/LOW COVERAGE/)).toBeInTheDocument()
    expect(screen.getByText(/1 of 4 evidence categories/)).toBeInTheDocument()
  })

  it("renders high coverage once evidence is verified", () => {
    render(<EvidenceCompleteness value={92} confidence="high" />)

    expect(screen.getByText("92%")).toBeInTheDocument()
    expect(screen.getByText("HIGH CONFIDENCE")).toBeInTheDocument()
    expect(screen.getByText(/HIGH COVERAGE/)).toBeInTheDocument()
    expect(screen.getByText(/4 of 4 evidence categories/)).toBeInTheDocument()
  })
})
