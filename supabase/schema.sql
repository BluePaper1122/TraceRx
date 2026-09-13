-- ResistAI — minimal Supabase Postgres schema.
--
-- Deliberately not a fully normalized clinical data model (no separate
-- cultures/susceptibilities/colonization_events tables). The deterministic
-- scoring engine still lives in the frontend fixtures for the hackathon
-- timeline; this schema exists to make patient data and assessment state
-- genuinely persisted and queryable instead of hardcoded in the JS bundle.
-- The `payload` JSONB columns store exactly the PatientRiskAssessment /
-- CounterfactualScenario[] shapes already defined in lib/types.

create table if not exists patients (
  id text primary key,
  display_name text not null,
  infection_context text not null,
  organism text,
  transfer_patient boolean not null default false,
  evidence_completeness int not null,
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  highest_risk_band text check (highest_risk_band in ('low', 'moderate', 'high')),
  external_data_available boolean not null default false,
  created_at timestamptz not null default now()
);

-- Multiple assessment versions per patient; exactly one is_active at a time.
-- Applying external history flips which version is active rather than
-- mutating a row in place, so assessment history stays inspectable.
create table if not exists assessments (
  id text primary key,
  patient_id text not null references patients(id) on delete cascade,
  version int not null default 1,
  is_active boolean not null default false,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create unique index if not exists assessments_one_active_per_patient
  on assessments (patient_id)
  where is_active;

create index if not exists assessments_patient_id_idx on assessments (patient_id);

create table if not exists counterfactual_scenarios (
  patient_id text primary key references patients(id) on delete cascade,
  payload jsonb not null
);
