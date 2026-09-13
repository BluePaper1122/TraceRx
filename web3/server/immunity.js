/**
 * Immunity module (readme-3) — synthetic CDS nested under ResistLens.
 * Roster: Patient #2 worked example + traps #4 / #7 / #10.
 */

const PATIENTS = {
  "2": {
    id: "2",
    label: "Patient #2 · ESBL bacteremia (worked example)",
    trap: null,
    colonization: { status: "positive", organism: "ESBL", daysAgo: 60 },
    priorIsolate: { status: "positive", organism: "ESBL", daysAgo: 90 },
    exposure90d: { status: "positive", drug: "ceftriaxone", daysAgo: 40 },
    antibiogramBaseline: 0.28,
  },
  "4": {
    id: "4",
    label: "Patient #4 · never tested (trap)",
    trap: "never_tested",
    colonization: { status: "not_tested", organism: null, daysAgo: null },
    priorIsolate: { status: "unknown", organism: null, daysAgo: null },
    exposure90d: { status: "none", drug: null, daysAgo: null },
    antibiogramBaseline: 0.18,
  },
  "7": {
    id: "7",
    label: "Patient #7 · stale MRSA flag (trap)",
    trap: "old_flag",
    colonization: { status: "positive", organism: "MRSA", daysAgo: 400 },
    priorIsolate: { status: "positive", organism: "MRSA", daysAgo: 400 },
    exposure90d: { status: "none", drug: null, daysAgo: null },
    antibiogramBaseline: 0.22,
  },
  "10": {
    id: "10",
    label: "Patient #10 · transfer file unavailable (trap)",
    trap: "unavailable_file",
    colonization: { status: "unavailable", organism: null, daysAgo: null },
    priorIsolate: { status: "unavailable", organism: null, daysAgo: null },
    exposure90d: { status: "unavailable", drug: null, daysAgo: null },
    antibiogramBaseline: 0.2,
  },
};

function clamp(n) {
  return Math.min(0.95, Math.max(0.03, n));
}

function stepColonization(p) {
  if (p.colonization.status === "not_tested") {
    return {
      id: "colonization",
      title: "Colonization never tested",
      detail: "Blank ≠ negative. Trap #4 — treat as risk, not safety.",
      delta: 0.15,
      warn: true,
    };
  }
  if (p.colonization.status === "unavailable") {
    return {
      id: "colonization",
      title: "Colonization file unavailable",
      detail: "Transfer packet missing. Trap #10 — do not assume clean.",
      delta: 0.2,
      warn: true,
    };
  }
  if (p.colonization.status !== "positive") {
    return {
      id: "colonization",
      title: "No active colonization flag",
      detail: "No lift from colonization.",
      delta: 0,
      warn: false,
    };
  }
  const days = p.colonization.daysAgo ?? 0;
  const weight = days <= 180 ? 1 : days < 365 ? 0.55 : 0.22;
  if (p.trap === "old_flag") {
    return {
      id: "colonization",
      title: `Stale ${p.colonization.organism} flag`,
      detail: `Detected ${days}d ago — still counts until clearance. Trap #7.`,
      delta: 0.18 * weight,
      warn: true,
    };
  }
  const lift = p.colonization.organism === "ESBL" ? 0.43 : 0.25;
  return {
    id: "colonization",
    title: `Colonization: ${p.colonization.organism}`,
    detail: `Detected ${days}d ago. Weight ${weight}.`,
    delta: lift * weight,
    warn: false,
  };
}

function stepPrior(p) {
  if (p.priorIsolate.status === "unavailable") {
    return {
      id: "prior_isolate",
      title: "Prior isolate unavailable",
      detail: "Missing transfer cultures. Trap #10.",
      delta: 0.12,
      warn: true,
    };
  }
  if (p.priorIsolate.status !== "positive") {
    return {
      id: "prior_isolate",
      title: "No prior isolate on file",
      detail: "No personal culture lift.",
      delta: 0,
      warn: false,
    };
  }
  return {
    id: "prior_isolate",
    title: `Prior isolate: ${p.priorIsolate.organism}`,
    detail: `${p.priorIsolate.daysAgo}d ago from this patient.`,
    delta: 0.16,
    warn: false,
  };
}

function stepExposure(p) {
  if (p.exposure90d.status === "unavailable") {
    return {
      id: "exposure",
      title: "90-day exposure unavailable",
      detail: "Cannot confirm recent antibiotics. Trap #10.",
      delta: 0.1,
      warn: true,
    };
  }
  if (p.exposure90d.status !== "positive") {
    return {
      id: "exposure",
      title: "No ~90-day drug exposure",
      detail: "No exposure lift.",
      delta: 0,
      warn: false,
    };
  }
  return {
    id: "exposure",
    title: `Recent ${p.exposure90d.drug}`,
    detail: `${p.exposure90d.daysAgo}d ago within ~90-day window.`,
    delta: 0.12,
    warn: false,
  };
}

export function listPatients() {
  return Object.values(PATIENTS).map((p) => ({
    id: p.id,
    label: p.label,
    trap: p.trap,
  }));
}

export function getPatient(id) {
  return PATIENTS[String(id)] || null;
}

export function scorePatient(id, drug = "ceftriaxone") {
  const p = getPatient(id);
  if (!p) return null;

  const steps = [
    {
      id: "antibiogram",
      title: "Unit antibiogram baseline",
      detail: `Population prior for ${drug}: ${(p.antibiogramBaseline * 100).toFixed(0)}%.`,
      delta: p.antibiogramBaseline,
      warn: false,
    },
    stepColonization(p),
    stepPrior(p),
    stepExposure(p),
  ];

  let probability = 0;
  for (const s of steps) probability += s.delta;
  probability = clamp(probability);
  const band = probability >= 0.6 ? "avoid" : probability >= 0.25 ? "caution" : "reasonable";

  return {
    patientId: p.id,
    label: p.label,
    trap: p.trap,
    drug,
    probability,
    band,
    steps,
    module: "immunity",
    parentProduct: "ResistLens",
  };
}
