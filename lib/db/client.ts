import postgres from "postgres"

let sql: ReturnType<typeof postgres> | null = null

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL)
}

/**
 * Lazy Postgres client. Returns null when DATABASE_URL isn't set so callers
 * (the assessment adapter) can fall back to the in-repo mock fixtures instead
 * of crashing — important while a real Supabase connection string hasn't
 * been wired in yet.
 */
export function getDb(): ReturnType<typeof postgres> | null {
  if (!isDatabaseConfigured()) return null

  if (!sql) {
    sql = postgres(process.env.DATABASE_URL!, {
      ssl: "require",
      prepare: false,
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
    })
  }

  return sql
}
