"use client"

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts"
import type { DrugRiskAssessment, RiskBand } from "@/lib/types"

const RISK_COLOR: Record<RiskBand, string> = {
  high: "var(--risk-high)",
  moderate: "var(--risk-moderate)",
  low: "var(--risk-low)",
}

export function ResistanceChart({ drugs }: { drugs: DrugRiskAssessment[] }) {
  const data = drugs.map((d) => ({ label: d.abbreviation ?? d.drug, score: d.prototypeScore, band: d.riskBand }))

  return (
    <div className="h-56 w-full" role="img" aria-label="Prototype resistance-risk signal by antibiotic">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
          <CartesianGrid horizontal={false} stroke="var(--border)" />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
          <YAxis type="category" dataKey="label" width={70} tick={{ fontSize: 12, fill: "var(--foreground)" }} />
          <Bar dataKey="score" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={RISK_COLOR[entry.band]} />
            ))}
            <LabelList dataKey="score" position="right" formatter={(v) => `${v}%`} className="fill-foreground text-xs" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
