export function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}

export function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value))
}
