import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ClinicalEvidenceAssistant } from "@/components/ai/clinical-evidence-assistant"
import { patient10After } from "@/lib/mock/patient-10-after"

describe("ClinicalEvidenceAssistant", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("shows a loading state then renders the response", async () => {
    let resolveFetch: (v: unknown) => void
    const pending = new Promise((resolve) => {
      resolveFetch = resolve
    })
    ;(global.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(pending)

    const user = userEvent.setup()
    render(
      <ClinicalEvidenceAssistant
        patientId="10"
        assessment={patient10After}
        trigger={<button>Ask Clinical Evidence Assistant</button>}
      />
    )

    await user.click(screen.getByRole("button", { name: /ask clinical evidence assistant/i }))
    await user.click(
      screen.getByRole("button", { name: /which evidence affected this assessment most/i })
    )

    expect(screen.getAllByText(/choose a suggested question|ask/i).length).toBeGreaterThan(0)

    resolveFetch!({
      ok: true,
      json: async () => ({
        title: "Why the signal changed",
        summary: "Prior resistant isolate drives the signal.",
        points: ["Prior AST is the strongest contributor."],
        sources: [{ id: "s1", label: "Patient culture", type: "Observation" }],
      }),
    })

    expect(await screen.findByText("Why the signal changed")).toBeInTheDocument()
    expect(screen.getByText(/Patient culture/)).toBeInTheDocument()
    expect(
      screen.getByText(/AI does not calculate the risk score/i)
    ).toBeInTheDocument()
  })

  it("shows an error state with a retry option on failure", async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Clinical Evidence Assistant is not configured." }),
    })

    const user = userEvent.setup()
    render(
      <ClinicalEvidenceAssistant
        patientId="10"
        assessment={patient10After}
        trigger={<button>Ask Clinical Evidence Assistant</button>}
      />
    )

    await user.click(screen.getByRole("button", { name: /ask clinical evidence assistant/i }))
    await user.click(
      screen.getByRole("button", { name: /which evidence affected this assessment most/i })
    )

    expect(await screen.findByText(/Evidence explanation unavailable/i)).toBeInTheDocument()
    expect(screen.getByText(/deterministic assessment remains available/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument()
  })
})
