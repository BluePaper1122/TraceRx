import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { EvidenceTimeline } from "@/components/timeline/evidence-timeline"
import { patient10After } from "@/lib/mock/patient-10-after"

describe("EvidenceTimeline", () => {
  it("renders S/I/R susceptibility results with accessible labels", async () => {
    const user = userEvent.setup()
    render(<EvidenceTimeline events={patient10After.timeline} />)

    const cultureEvent = screen.getByText("E. coli culture")
    await user.click(cultureEvent)

    expect(await screen.findByText("Susceptible")).toBeInTheDocument()
    expect(screen.getAllByText("Resistant").length).toBeGreaterThan(0)

    const rChips = screen.getAllByText("R")
    const sChips = screen.getAllByText("S")
    expect(rChips.length).toBeGreaterThan(0)
    expect(sChips.length).toBeGreaterThan(0)
  })

  it("shows an empty state with no events", () => {
    render(<EvidenceTimeline events={[]} />)
    expect(screen.getByText(/No timeline events available/i)).toBeInTheDocument()
  })
})
