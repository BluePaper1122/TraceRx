import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CounterfactualExplorer } from "@/components/counterfactual/counterfactual-explorer"
import { patient10After, patient10CounterfactualScenarios } from "@/lib/mock/patient-10-after"

describe("CounterfactualExplorer", () => {
  it("switches the active scenario when an evidence toggle changes", async () => {
    const user = userEvent.setup()
    render(
      <CounterfactualExplorer
        drugs={patient10After.drugs}
        scenarios={patient10CounterfactualScenarios}
      />
    )

    expect(screen.getByText(/Ceftriaxone across scenarios/i)).toBeInTheDocument()

    const priorAstToggle = screen.getByLabelText("Prior AST")
    expect(priorAstToggle).toHaveAttribute("aria-checked", "true")

    await user.click(priorAstToggle)

    expect(priorAstToggle).toHaveAttribute("aria-checked", "false")
  })

  it("switches the inspected drug when a drug chip is selected", async () => {
    const user = userEvent.setup()
    render(
      <CounterfactualExplorer
        drugs={patient10After.drugs}
        scenarios={patient10CounterfactualScenarios}
      />
    )

    await user.click(screen.getByRole("button", { name: "Meropenem" }))
    expect(screen.getByText(/Meropenem across scenarios/i)).toBeInTheDocument()
  })
})
