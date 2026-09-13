export function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function daysAgoFrom(iso: string, now: Date = new Date()): number {
  const then = new Date(iso).getTime()
  const diffMs = now.getTime() - then
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)))
}

export function formatDaysAgo(days: number): string {
  if (days === 0) return "today"
  if (days === 1) return "1 day ago"
  return `${days} days ago`
}
