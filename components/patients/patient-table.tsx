"use client"

import { useMemo, useState } from "react"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PatientSearch, type RiskFilter, type TransferFilter } from "./patient-search"
import { PatientRow } from "./patient-row"
import type { PatientSummary } from "@/lib/types"

export function PatientTable({ patients }: { patients: PatientSummary[] }) {
  const [query, setQuery] = useState("")
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all")
  const [transferFilter, setTransferFilter] = useState<TransferFilter>("all")

  const filtered = useMemo(() => {
    return patients.filter((p) => {
      const matchesQuery =
        query.trim().length === 0 ||
        p.displayName.toLowerCase().includes(query.toLowerCase()) ||
        p.infectionContext.toLowerCase().includes(query.toLowerCase()) ||
        p.organism?.toLowerCase().includes(query.toLowerCase())

      const matchesRisk = riskFilter === "all" || p.highestRiskBand === riskFilter
      const matchesTransfer =
        transferFilter === "all" ||
        (transferFilter === "transfer" && p.transferPatient) ||
        (transferFilter === "local" && !p.transferPatient)

      return matchesQuery && matchesRisk && matchesTransfer
    })
  }, [patients, query, riskFilter, transferFilter])

  return (
    <div className="space-y-4">
      <PatientSearch
        query={query}
        onQueryChange={setQuery}
        riskFilter={riskFilter}
        onRiskFilterChange={setRiskFilter}
        transferFilter={transferFilter}
        onTransferFilterChange={setTransferFilter}
      />

      <div className="rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Context</TableHead>
                <TableHead>Organism</TableHead>
                <TableHead>Evidence</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">
                    No patients match these filters.
                  </td>
                </TableRow>
              ) : (
                filtered.map((patient) => <PatientRow key={patient.id} patient={patient} />)
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
