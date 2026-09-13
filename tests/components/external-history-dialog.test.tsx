import { describe, expect, it, vi } from "vitest"
import { render, screen, act } from "@testing-library/react"
import { ExternalHistoryDialog } from "@/components/transfer/external-history-dialog"

describe("ExternalHistoryDialog", () => {
  it("moves through retrieval states and reaches Apply evidence", async () => {
    vi.useFakeTimers()
    const onApply = vi.fn()

    render(<ExternalHistoryDialog open onOpenChange={() => {}} onApply={onApply} />)

    expect(screen.getByText(/Searching participating institutions/i)).toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(450)
    })
    expect(screen.getByText(/Patient match found/i)).toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(450)
    })
    expect(screen.getByText(/Retrieving FHIR resources/i)).toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(450 * 3)
    })
    expect(screen.getByText(/Verifying provenance/i)).toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(450 * 3)
    })
    expect(screen.getByText(/Verified external history ready/i)).toBeInTheDocument()

    vi.useRealTimers()
  })
})
