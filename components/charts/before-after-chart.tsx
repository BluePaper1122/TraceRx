"use client"

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export interface BeforeAfterPoint {
  drug: string
  before: number
  after: number
}

export function BeforeAfterChart({ data }: { data: BeforeAfterPoint[] }) {
  return (
    <div className="h-64 w-full" role="img" aria-label="Prototype resistance-risk signal before and after applying verified external history">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="drug" tick={{ fontSize: 12, fill: "var(--foreground)" }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
          <Tooltip
            formatter={(value) => `${value}%`}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--popover-foreground)",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="before" name="Before" fill="var(--data-missing)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="after" name="After" fill="var(--clinical-primary)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
