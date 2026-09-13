/**
 * Seeds Supabase Postgres with the same fixture data the frontend used to
 * import directly (lib/mock/*). Run with: npm run db:seed
 *
 * Safe to re-run — it drops and recreates the three tables each time so the
 * demo data always starts from a known-good state before judging.
 */
import "dotenv/config"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import postgres from "postgres"

import { patients } from "../lib/mock/patients"
import { patient10Before } from "../lib/mock/patient-10-before"
import { patient10After, patient10CounterfactualScenarios } from "../lib/mock/patient-10-after"
import { buildGenericAssessment } from "../lib/mock/generic-assessment"

const __dirname = dirname(fileURLToPath(import.meta.url))

// postgres.js's sql.json() wants a structural JSONValue; our domain types are
// plain data but TS can't prove it structurally, so round-trip through JSON.
function toJson<T>(value: T): postgres.JSONValue {
  return JSON.parse(JSON.stringify(value))
}

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error(
      "DATABASE_URL is not set. Add your Supabase Postgres connection string to .env.local first."
    )
    process.exit(1)
  }

  const sql = postgres(connectionString, { ssl: "require", prepare: false })

  try {
    console.log("Applying schema...")
    const schemaSql = readFileSync(join(__dirname, "../supabase/schema.sql"), "utf-8")
    await sql.unsafe(schemaSql)

    console.log("Clearing existing seed data...")
    await sql`delete from counterfactual_scenarios`
    await sql`delete from assessments`
    await sql`delete from patients`

    console.log(`Seeding ${patients.length} patients...`)
    for (const p of patients) {
      await sql`
        insert into patients (
          id, display_name, infection_context, organism, transfer_patient,
          evidence_completeness, confidence, highest_risk_band, external_data_available
        ) values (
          ${p.id}, ${p.displayName}, ${p.infectionContext}, ${p.organism ?? null}, ${p.transferPatient},
          ${p.evidenceCompleteness}, ${p.confidence}, ${p.highestRiskBand ?? null}, ${p.externalDataAvailable}
        )
      `
    }

    console.log("Seeding Patient #10 assessment versions (before/after)...")
    await sql`
      insert into assessments (id, patient_id, version, is_active, payload)
      values ('patient-10-v1', '10', 1, true, ${sql.json(toJson(patient10Before))})
    `
    await sql`
      insert into assessments (id, patient_id, version, is_active, payload)
      values ('patient-10-v2', '10', 2, false, ${sql.json(toJson(patient10After))})
    `
    await sql`
      insert into counterfactual_scenarios (patient_id, payload)
      values ('10', ${sql.json(toJson(patient10CounterfactualScenarios))})
    `

    console.log("Seeding assessments for the remaining roster patients...")
    for (const p of patients) {
      if (p.id === "10") continue
      const assessment = buildGenericAssessment(p)
      await sql`
        insert into assessments (id, patient_id, version, is_active, payload)
        values (${"patient-" + p.id + "-v1"}, ${p.id}, 1, true, ${sql.json(toJson(assessment))})
      `
    }

    console.log("Seed complete.")
  } finally {
    await sql.end()
  }
}

main().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
