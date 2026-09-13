"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { RiskBand } from "@/lib/types"

export type RiskFilter = RiskBand | "all"
export type TransferFilter = "all" | "transfer" | "local"

export function PatientSearch({
  query,
  onQueryChange,
  riskFilter,
  onRiskFilterChange,
  transferFilter,
  onTransferFilterChange,
}: {
  query: string
  onQueryChange: (value: string) => void
  riskFilter: RiskFilter
  onRiskFilterChange: (value: RiskFilter) => void
  transferFilter: TransferFilter
  onTransferFilterChange: (value: TransferFilter) => void
}) {
  const riskOptions: { value: RiskFilter; label: string }[] = [
    { value: "all", label: "All risk" },
    { value: "high", label: "High" },
    { value: "moderate", label: "Moderate" },
    { value: "low", label: "Low" },
  ]

  const transferOptions: { value: TransferFilter; label: string }[] = [
    { value: "all", label: "All patients" },
    { value: "transfer", label: "Transfer only" },
    { value: "local", label: "Local only" },
  ]

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search patients…"
          className="pl-8"
          aria-label="Search patients"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {riskOptions.map((opt) => (
          <FilterChip key={opt.value} active={riskFilter === opt.value} onClick={() => onRiskFilterChange(opt.value)}>
            {opt.label}
          </FilterChip>
        ))}
        <span className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden="true" />
        {transferOptions.map((opt) => (
          <FilterChip key={opt.value} active={transferFilter === opt.value} onClick={() => onTransferFilterChange(opt.value)}>
            {opt.label}
          </FilterChip>
        ))}
      </div>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full",
        active && "border-clinical-primary bg-clinical-primary text-clinical-primary-foreground hover:bg-clinical-primary/90"
      )}
    >
      {children}
    </Button>
  )
}
