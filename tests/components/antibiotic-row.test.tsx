import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Table, TableBody } from "@/components/ui/table"
import { AntibioticRow } from "@/components/dashboard/antibiotic-row"
import { patient10Before } from "@/lib/mock/patient-10-before"

describe("AntibioticRow", () => {
  it("opens the Why? evidence sheet with the evidence chain", async () => {
    const user = userEvent.setup()
    const drug = patient10Before.drugs[0]

    render(
      <Table>
        <TableBody>
          <AntibioticRow drug={drug} assessment={patient10Before} />
        </TableBody>
      </Table>
    )

    expect(screen.queryByText(/Why is Ceftriaxone flagged/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Why?" }))

    expect(await screen.findByText(/Why is Ceftriaxone flagged/i)).toBeInTheDocument()
    expect(screen.getByText(/Local hospital antibiogram/i)).toBeInTheDocument()
    expect(screen.getByText(/Prototype research heuristic/i)).toBeInTheDocument()
  })
})
