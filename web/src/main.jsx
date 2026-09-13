import "./brand-storage.js";
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Beaker,
  BookOpenCheck,
  Bot,
  ChevronRight,
  FileScan,
  FlaskConical,
  Home,
  Info,
  Menu,
  Moon,
  Network,
  PanelLeftClose,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  UserRoundSearch,
  X,
} from "lucide-react";
import "./style.css";
const pages = [
  "Start here",
  "Overview",
  "Patient workspace",
  "Document studio",
  "Evaluation lab",
  "AI connection",
  "Vision benchmark",
  "Synthetic model lab",
  "About & demo",
];
const pageDetails = {
  "Start here": {
    group: "Workflow",
    icon: Home,
    eyebrow: "Guided case",
    description: "Follow one synthetic case from evidence to review.",
  },
  Overview: {
    group: "Workflow",
    icon: BarChart3,
    eyebrow: "Review queue",
    description: "Scan case status, workload, and exportable evidence.",
  },
  "Patient workspace": {
    group: "Workflow",
    icon: UserRoundSearch,
    eyebrow: "Case review",
    description: "Inspect the resistance scorecard and its evidence chain.",
  },
  "Document studio": {
    group: "Workflow",
    icon: FileScan,
    eyebrow: "Source intake",
    description: "Extract, verify, and import synthetic documents.",
  },
  "Evaluation lab": {
    group: "Labs",
    icon: FlaskConical,
    eyebrow: "Rule evaluation",
    description: "Exercise deterministic reconciliation scenarios.",
  },
  "AI connection": {
    group: "Labs",
    icon: Bot,
    eyebrow: "Optional intelligence",
    description: "Connect and verify an AI provider for this session.",
  },
  "Vision benchmark": {
    group: "Labs",
    icon: Activity,
    eyebrow: "Model quality",
    description: "Review extraction performance on synthetic evidence.",
  },
  "Synthetic model lab": {
    group: "Labs",
    icon: Beaker,
    eyebrow: "Teaching model",
    description: "Explore candidate ranking with fabricated model outputs.",
  },
  "About & demo": {
    group: "Project",
    icon: Info,
    eyebrow: "Project story",
    description: "Understand the architecture, limits, and demo path.",
  },
};
const scenarios = [
  "Not tested",
  "Aged positive",
  "Transfer records unavailable",
  "MRSA persistence",
  "MRSA clearance",
];
const pretty = (x) => JSON.stringify(x, null, 2);
function Json({ value }) {
  return <pre>{pretty(value)}</pre>;
}
function Check({ children, checked, onChange }) {
  return (
    <label className="check">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {children}
    </label>
  );
}
function Select({ label, value, onChange, options }) {
  return (
    <label>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((x) => (
          <option
            key={typeof x === "string" ? x : x.value}
            value={typeof x === "string" ? x : x.value}
          >
            {typeof x === "string" ? x : x.label}
          </option>
        ))}
      </select>
    </label>
  );
}
function Table({ rows }) {
  if (!rows?.length) return <p>No records to display.</p>;
  const keys = Object.keys(rows[0]);
  return (
    <div className="table">
      <table>
        <thead>
          <tr>
            {keys.map((k) => (
              <th key={k}>{k.replaceAll("_", " ")}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {keys.map((k) => (
                <td key={k}>
                  {typeof r[k] === "object"
                    ? JSON.stringify(r[k])
                    : String(r[k] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Findings({ items }) {
  return items.map((f, i) => (
    <div
      className={"notice " + (f.state === "Needs review" ? "warn" : "")}
      key={i}
    >
      <strong>{f.state}</strong>
      <p>{f.reasons?.join(" ") || f.reason}</p>
      <small>
        {f.order_id} {f.report_id && " · " + f.report_id}
      </small>
    </div>
  ));
}
function useData(api, path) {
  const [data, set] = useState(null),
    [error, err] = useState("");
  useEffect(() => {
    let active = true;
    set(null);
    err("");
    api(path)
      .then((d) => active && set(d))
      .catch((e) => active && err(e.message));
    return () => {
      active = false;
    };
  }, [path]);
  return [data, error];
}
function Metrics({ values }) {
  return (
    <div className="metrics">
      {Object.entries(values).map(([k, v]) => (
        <div className="metric" key={k}>
          <small>{k}</small>
          <strong>{v}</strong>
        </div>
      ))}
    </div>
  );
}
function save(data, name) {
  const url = URL.createObjectURL(
    data instanceof Blob
      ? data
      : new Blob([pretty(data)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function StorageStatus({ api }) {
  const [info, set] = useState(null);
  useEffect(() => {
    let active = true;
    api("/audit/history")
      .then((d) => active && set(d))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  if (!info) return null;
  return (
    <p className="muted">
      {info.enabled
        ? "Durable storage connected · audit log persisted"
        : "Durable storage not configured · in-memory only"}
    </p>
  );
}
function ThemeToggle({ theme, onToggle }) {
  const nextTheme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
      aria-pressed={theme === "dark"}
    >
      <Sun aria-hidden="true" />
      <span className="toggle-track" aria-hidden="true">
        <span />
      </span>
      <Moon aria-hidden="true" />
      <span className="theme-label">{theme} mode</span>
    </button>
  );
}
function ProductMark() {
  return (
    <div className="product-mark" aria-label="TraceRx">
      <span className="mark-icon" aria-hidden="true">
        <Network />
      </span>
      <span>
        <strong>TraceRx</strong>
        <small>Evidence review workspace</small>
      </span>
    </div>
  );
}
function App() {
  const [token, T] = useState(""),
    [state, S] = useState(null),
    [page, P] = useState(pages[0]),
    [busy, B] = useState(false),
    [error, E] = useState(""),
    [success, U] = useState(""),
    [reset, R] = useState(false),
    [menu, M] = useState(false),
    [theme, setTheme] = useState(() => {
      const saved = localStorage.getItem("tracerx-theme");
      return saved === "light" || saved === "dark"
        ? saved
        : matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    });
  async function api(
    path,
    body,
    method = body === undefined ? "GET" : "POST",
    binary = false,
    auth = token,
  ) {
    const r = await fetch("/api" + path, {
      method,
      headers: {
        ...(auth ? { Authorization: "Bearer " + auth } : {}),
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!r.ok) {
      const x = await r.json().catch(() => ({}));
      throw Error(x.detail || "Request failed. Please try again.");
    }
    return binary ? r.blob() : r.json();
  }
  useEffect(() => {
    let active = true;
    async function start() {
      let sessionToken = sessionStorage.getItem("tracerx-session");
      if (sessionToken) {
        try {
          const existing = await api(
            "/state",
            undefined,
            "GET",
            false,
            sessionToken,
          );
          if (active) {
            T(sessionToken);
            S(existing);
          }
          return;
        } catch {
          sessionStorage.removeItem("tracerx-session");
        }
      }
      const created = await api("/session", {});
      sessionToken = created.token;
      const fresh = await api("/state", undefined, "GET", false, sessionToken);
      if (active) {
        sessionStorage.setItem("tracerx-session", sessionToken);
        T(sessionToken);
        S(fresh);
      }
    }
    start().catch((e) => E(e.message));
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("tracerx-theme", theme);
  }, [theme]);
  useEffect(() => {
    const closeOnEscape = (event) => event.key === "Escape" && M(false);
    addEventListener("keydown", closeOnEscape);
    return () => removeEventListener("keydown", closeOnEscape);
  }, []);
  async function run(fn) {
    B(true);
    E("");
    U("");
    try {
      await fn();
    } catch (e) {
      E(e.message);
    } finally {
      B(false);
    }
  }
  const download = (kind) =>
    run(async () =>
      save(
        await api("/export/" + kind, undefined, "GET", true),
        "tracerx-" +
          kind +
          (kind === "session" ? ".json" : kind === "queue" ? ".csv" : ".zip"),
      ),
    );
  const navigate = (destination) => {
    P(destination);
    M(false);
    E("");
    U("");
    scrollTo({ top: 0, behavior: "smooth" });
  };
  const ctx = {
    api,
    state,
    setState: S,
    run,
    busy,
    success: U,
    download,
    navigate,
  };
  const activePage = pageDetails[page];
  return (
    <div className="app-shell">
      <button
        className="menu"
        onClick={() => M(!menu)}
        aria-label={menu ? "Close navigation" : "Open navigation"}
        aria-expanded={menu}
      >
        {menu ? <X /> : <Menu />}
      </button>
      {menu && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => M(false)}
        />
      )}
      <aside className={menu ? "sidebar open" : "sidebar"}>
        <ProductMark />
        <nav aria-label="Primary navigation">
          {["Workflow", "Labs", "Project"].map((group) => (
            <div className="nav-group" key={group}>
              <small>{group}</small>
              {pages
                .filter((item) => pageDetails[item].group === group)
                .map((item) => {
                  const Icon = pageDetails[item].icon;
                  return (
                    <button
                      disabled={busy}
                      className={page === item ? "active" : ""}
                      key={item}
                      onClick={() => navigate(item)}
                      aria-current={page === item ? "page" : undefined}
                    >
                      <Icon aria-hidden="true" />
                      <span>{item}</span>
                    </button>
                  );
                })}
            </div>
          ))}
        </nav>
        {state && (
          <>
            <hr />
            <label>
              Evaluation time · hour {state.offset}
              <input
                aria-label="Evaluation time"
                disabled={busy}
                type="range"
                min="0"
                max="48"
                value={state.offset}
                onChange={(e) =>
                  run(async () =>
                    S(await api("/clock", { offset: Number(e.target.value) })),
                  )
                }
              />
            </label>
            <small>{state.as_of.replace("T", " ")}</small>
            <p className="muted">
              {state.connection.configured
                ? "AI connection verified for this session"
                : "Demo mode · no AI key connected"}
            </p>
            <StorageStatus api={api} />
            <Check checked={reset} onChange={R}>
              Confirm session reset
            </Check>
            <button
              disabled={!reset || busy}
              onClick={() =>
                run(async () => {
                  await api("/session", undefined, "DELETE");
                  sessionStorage.removeItem("tracerx-session");
                  location.reload();
                })
              }
            >
              Reset synthetic session
            </button>
          </>
        )}
      </aside>
      <div className="app-frame">
        <header className="topbar">
          <div className="mobile-brand">
            <ProductMark />
          </div>
          <div className="breadcrumb">
            <strong>{page}</strong>
            <ChevronRight aria-hidden="true" />
            <span>{activePage.eyebrow}</span>
          </div>
          <div className="topbar-actions">
            <div className="demo-ready">
              <span className="status-dot" />
              <span>
                <strong>Demo ready</strong>
                <small>Synthetic environment</small>
              </span>
            </div>
            <ThemeToggle
              theme={theme}
              onToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
            />
          </div>
        </header>
        <main>
          <div className="disclaimer" role="note">
            <ShieldCheck aria-hidden="true" />
            <p>
              <strong>Synthetic demonstration only.</strong> No real patient
              data. Not a diagnostic or treatment recommendation tool.
            </p>
          </div>
          {error && (
            <div role="alert" className="notice warn">
              {error}
            </div>
          )}
          {success && (
            <div role="status" className="notice">
              {success}
            </div>
          )}
          {busy && <p role="status">Working…</p>}
          {!state ? (
            <div className="loading-state">
              <span /> Loading workspace&hellip;
            </div>
          ) : (
            <>
              {page !== pages[0] && (
                <header className="page-heading">
                  <div className="page-heading-icon">
                    {React.createElement(activePage.icon)}
                  </div>
                  <div>
                    <small>{activePage.eyebrow}</small>
                    <h1>{page}</h1>
                    <p>{activePage.description}</p>
                  </div>
                </header>
              )}
              {page === pages[0] ? (
                <Guide {...ctx} />
              ) : page === pages[1] ? (
                <Overview {...ctx} />
              ) : page === pages[2] ? (
                <Workspace {...ctx} />
              ) : page === pages[3] ? (
                <Studio {...ctx} />
              ) : page === pages[4] ? (
                <Evaluation {...ctx} />
              ) : page === pages[5] ? (
                <Connection {...ctx} />
              ) : page === pages[6] ? (
                <Benchmark {...ctx} />
              ) : page === pages[7] ? (
                <SyntheticModelLab {...ctx} />
              ) : (
                <About {...ctx} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
function Guide({ api, state, setState, run, busy, navigate }) {
  const [step, set] = useState(0),
    [data, error] = useData(api, "/guide/" + step);
  const steps = [
    ["Before the result", "Context and evidence"],
    ["Final result arrives", "Review and reconcile"],
    ["Record a review", "Add human assessment"],
    ["Evidence trail", "Complete and export"],
  ];
  const explanation =
    step === 0
      ? "An active order exists, but the final result has not arrived."
      : step === 1
        ? "A final report arrived after the order started. A review is now due."
        : step === 2
          ? "This guided example simulates a review linked to the specific order and report."
          : "The source documents and explicit links make the decision traceable.";
  return (
    <div className="guide">
      <section className="intro-panel">
        <div className="intro-copy">
          <small>HackRice 2026 · Evidence review</small>
          <h1>Close the evidence-to-review gap.</h1>
          <p>
            Bring source evidence, <strong>deterministic checks</strong>, and
            human review into one traceable workspace.
          </p>
          <button
            className="primary intro-action"
            onClick={() => setStep(Math.min(step + 1, 3))}
          >
            Continue guided case <ArrowRight aria-hidden="true" />
          </button>
        </div>
        <div className="evidence-flow" aria-label="Evidence review workflow">
          {[
            [FileScan, "Source", "New evidence arrives"],
            [SlidersHorizontal, "Reconcile", "Check the active order"],
            [BookOpenCheck, "Review", "Trace the documented review"],
          ].map(([Icon, title, detail], index) => (
            <React.Fragment key={title}>
              <div className="flow-node">
                <span>
                  <Icon aria-hidden="true" />
                </span>
                <strong>{title}</strong>
                <small>{detail}</small>
              </div>
              {index < 2 && (
                <ArrowRight className="flow-arrow" aria-hidden="true" />
              )}
            </React.Fragment>
          ))}
        </div>
      </section>
      <div
        className="guide-steps"
        role="tablist"
        aria-label="Guided case steps"
      >
        {steps.map(([title, detail], index) => (
          <button
            className={step === index ? "active" : ""}
            key={title}
            onClick={() => set(index)}
            role="tab"
            aria-selected={step === index}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <span>
              <strong>{title}</strong>
              <small>{detail}</small>
            </span>
          </button>
        ))}
      </div>
      {error && <p role="alert">{error}</p>}
      {data && (
        <div className="guide-layout">
          <section className="current-case">
            <header className="case-head">
              <span className="case-icon">
                <FileScan aria-hidden="true" />
              </span>
              <div>
                <div className="case-title-line">
                  <h2>Current case</h2>
                  <span className="synthetic-badge">Synthetic case</span>
                </div>
                <p>Antibiotic resistance evidence review · Demo scenario</p>
              </div>
              <small>Step {String(step + 1).padStart(2, "0")} of 04</small>
            </header>
            <div className="case-step">
              <span>{String(step + 1).padStart(2, "0")}</span>
              <div>
                <h3>{steps[step][0]}</h3>
                <p>{explanation}</p>
              </div>
            </div>
            <Findings items={data.findings} />
            <div className="source-cards">
              {data.documents.map((document) => (
                <details key={document.document_id}>
                  <summary>
                    <span>
                      <BookOpenCheck aria-hidden="true" /> {document.title}
                    </span>
                    <ChevronRight aria-hidden="true" />
                  </summary>
                  <pre>{document.text}</pre>
                  <Json value={document.event} />
                </details>
              ))}
            </div>
          </section>
          <section className="demo-control">
            <header>
              <SlidersHorizontal aria-hidden="true" />
              <div>
                <h2>Demo control</h2>
                <p>Adjust the synthetic timeline.</p>
              </div>
            </header>
            <label>
              <span>Evaluation time</span>
              <strong>Hour {state.offset}</strong>
              <input
                aria-label="Evaluation time"
                disabled={busy}
                type="range"
                min="0"
                max="48"
                value={state.offset}
                onChange={(event) =>
                  run(async () =>
                    setState(
                      await api("/clock", {
                        offset: Number(event.target.value),
                      }),
                    ),
                  )
                }
              />
            </label>
            <div className="control-status">
              <Bot aria-hidden="true" />
              <span>
                <strong>AI connection</strong>
                <small>
                  {state.connection.configured ? "Verified" : "Demo mode"}
                </small>
              </span>
              <span className="status-pill">
                <span className="status-dot" />
                {state.connection.configured ? "Connected" : "Optional"}
              </span>
            </div>
            <div className="control-note">
              <Info aria-hidden="true" />
              All outputs remain synthetic and for demonstration only.
            </div>
            <button
              className="primary wide"
              onClick={() => navigate("Patient workspace")}
            >
              Open patient workspace <ArrowRight aria-hidden="true" />
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
function Overview({ state, download }) {
  const [filter, F] = useState("All"),
    [unit, U] = useState("All");
  const rows = state.cases.filter(
    (c) =>
      (filter === "All" || c.state === filter) &&
      (unit === "All" || c.unit === unit),
  );
  return (
    <>
      <Metrics
        values={{
          "Synthetic cases": state.cases.length,
          "Needs review": state.cases.filter((c) => c.state === "Needs review")
            .length,
          "Needs verification": state.cases.filter(
            (c) => c.state === "Needs verification",
          ).length,
          Reviewed: state.cases.filter((c) => c.state === "Reviewed").length,
        }}
      />
      <div className="two">
        <Select
          label="Review state"
          value={filter}
          onChange={F}
          options={["All", ...new Set(state.cases.map((c) => c.state))]}
        />
        <Select
          label="Unit"
          value={unit}
          onChange={U}
          options={["All", ...new Set(state.cases.map((c) => c.unit))]}
        />
      </div>
      <Table
        rows={rows.map((c) => ({
          Patient: c.patient_id,
          Scenario: c.label,
          Unit: c.unit,
          State: c.state,
          Documents: c.documents.length,
        }))}
      />
      <div className="actions">
        <button onClick={() => download("queue")}>
          Download full queue CSV
        </button>
        <button onClick={() => download("session")}>
          Download session JSON
        </button>
        <button onClick={() => download("evidence")}>
          Download evidence bundle
        </button>
      </div>
      <details>
        <summary>Session audit trail</summary>
        <Json value={state.audit} />
      </details>
    </>
  );
}
function Workspace(ctx) {
  const { state } = ctx;
  const [patient, P] = useState(state.cases[0].patient_id),
    [tab, T] = useState("Timeline");
  const c = state.cases.find((c) => c.patient_id === patient) || state.cases[0];
  return (
    <>
      <Select
        label="Synthetic case"
        value={c.patient_id}
        onChange={P}
        options={state.cases.map((c) => ({
          value: c.patient_id,
          label: c.patient_id + " · " + c.label,
        }))}
      />
      <p>{c.story}</p>
      <Findings items={c.findings} />
      <div className="tabs">
        {[
          "Timeline",
          "Source evidence",
          "Record review",
          "Resistance scorecard",
        ].map((t) => (
          <button
            className={tab === t ? "active" : ""}
            key={t}
            onClick={() => T(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Timeline" ? (
        c.documents
          .slice()
          .sort((a, b) =>
            String(a.event.occurred_at).localeCompare(
              String(b.event.occurred_at),
            ),
          )
          .map((d) => (
            <article className="timeline" key={d.document_id}>
              <small>
                {d.event.occurred_at || "Unknown time"}{" "}
                {new Date(d.event.occurred_at) > new Date(state.as_of)
                  ? " · Future evidence"
                  : ""}
              </small>
              <h3>{d.title}</h3>
              <p>
                {d.event.kind} · {d.event.event_id}
              </p>
            </article>
          ))
      ) : tab === "Source evidence" ? (
        c.documents.map((d) => (
          <details key={d.document_id}>
            <summary>
              {d.title} · {d.verified ? "Verified" : "Needs verification"}
            </summary>
            {d.text ? (
              <pre>{d.text}</pre>
            ) : (
              <SourceImage api={ctx.api} digest={d.sha256} />
            )}
            <Json value={d.event} />
            <Json value={c.readiness[d.document_id]} />
          </details>
        ))
      ) : tab === "Record review" ? (
        <ReviewForm {...ctx} key={patient} c={c} />
      ) : (
        <Risk {...ctx} key={patient} patient={c.patient_id} />
      )}
    </>
  );
}
function SourceImage({ api, digest }) {
  const [url, U] = useState("");
  useEffect(() => {
    let active = true,
      url;
    api("/source/" + digest, undefined, "GET", true)
      .then((b) => {
        url = URL.createObjectURL(b);
        if (active) U(url);
        else URL.revokeObjectURL(url);
      })
      .catch(() => {});
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [digest]);
  return url ? (
    <img className="source" alt="Retained synthetic source" src={url} />
  ) : (
    <p>Source image unavailable in this session.</p>
  );
}
function ReviewForm({ c, api, setState, run, busy, success }) {
  const pairs = c.findings.filter((f) => f.state === "Needs review");
  const [idx, I] = useState("0"),
    [name, N] = useState(""),
    [note, O] = useState(""),
    [ok, K] = useState(false);
  if (!pairs.length)
    return <p>No open order/report pairs at the selected time.</p>;
  const f = pairs[Number(idx)] || pairs[0];
  return (
    <fieldset disabled={busy}>
      <Select
        label="Order / report pair"
        value={idx}
        onChange={(v) => {
          I(v);
          K(false);
        }}
        options={pairs.map((p, i) => ({
          value: String(i),
          label: p.order_id + " / " + p.report_id,
        }))}
      />
      <label>
        Reviewer
        <input
          value={name}
          onChange={(e) => N(e.target.value)}
          maxLength={80}
        />
      </label>
      <label>
        Source-linked review note
        <textarea
          value={note}
          onChange={(e) => O(e.target.value)}
          maxLength={1500}
        />
      </label>
      <Check checked={ok} onChange={K}>
        I inspected the synthetic source and confirm this review.
      </Check>
      <button
        className="primary"
        disabled={!ok || !name.trim() || !note.trim()}
        onClick={() =>
          run(async () => {
            setState(
              await api("/review", {
                patient_id: c.patient_id,
                order_id: f.order_id,
                report_id: f.report_id,
                reviewer: name,
                note,
                confirmed: ok,
              }),
            );
            K(false);
            success("Review recorded for this order and report.");
          })
        }
      >
        Record review
      </button>
    </fieldset>
  );
}
const FLAG_LABELS = {
  BASELINE_UNAVAILABLE:
    "No matching local baseline — using the 0.15 illustrative fallback",
  DATA_UNAVAILABLE: "Transfer records unavailable from the source institution",
  DATA_GAP_UNORDERED: "Susceptibility test not ordered",
  TEST_STATUS_UNKNOWN: "Test status unknown",
  AGED_POSITIVE:
    "Positive evidence present, but aged — weighted down rather than dropped",
  DOCUMENTED_INPUTS: "All inputs for this scorecard are documented",
};
function riskBand(score) {
  if (score >= 0.6) return { key: "high", label: "Higher", symbol: "●" };
  if (score >= 0.35) return { key: "moderate", label: "Moderate", symbol: "▲" };
  return { key: "low", label: "Lower", symbol: "✓" };
}
function RiskBadge({ score }) {
  const band = riskBand(score);
  return (
    <span className={"risk-badge risk-" + band.key}>
      <span aria-hidden="true">{band.symbol}</span>
      {band.label.toUpperCase()} · {(score * 100).toFixed(0)}%
    </span>
  );
}
function DataQualityFlags({ flags }) {
  if (!flags?.length) return null;
  return (
    <ul className="flags">
      {flags.map((f) => (
        <li
          key={f}
          className={
            "flag " + (f === "DOCUMENTED_INPUTS" ? "flag-ok" : "flag-gap")
          }
        >
          {FLAG_LABELS[f] || f}
        </li>
      ))}
    </ul>
  );
}
function EvidenceFactor({ f }) {
  const dots = Math.max(
    0,
    Math.min(5, Math.round((f.decay_modifier ?? 1) * 5)),
  );
  const sign = f.adjustment > 0 ? "+" : "";
  return (
    <div className="factor">
      <div className="factor-head">
        <strong>{f.factor}</strong>
        <span
          className={
            "adj " +
            (f.adjustment > 0 ? "up" : f.adjustment < 0 ? "down" : "flat")
          }
        >
          {sign}
          {f.adjustment.toFixed(2)}
        </span>
      </div>
      <p>{f.explanation}</p>
      {f.source_quote && <p className="quote">“{f.source_quote}”</p>}
      <div className="factor-meta">
        <span
          className="dots"
          aria-label={
            "Evidence weight " + (f.decay_modifier ?? 1).toFixed(2) + " of 1"
          }
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <i key={i} className={i < dots ? "on" : ""} />
          ))}
        </span>
        <small>
          {f.source_date
            ? new Date(f.source_date).toLocaleDateString()
            : "No date · policy default"}
        </small>
      </div>
    </div>
  );
}
function TransferLookup({
  api,
  patient,
  scenario,
  run,
  busy,
  success,
  onResult,
}) {
  const [stage, Stage] = useState("idle");
  function start() {
    Stage("searching");
    const reduced =
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    const unit = reduced ? 40 : 550;
    setTimeout(() => Stage("verifying"), unit);
    setTimeout(() => Stage("ready"), unit * 2);
  }
  function apply() {
    run(async () => {
      const result = await api("/risk", {
        patient_id: patient,
        scenario,
        lookup: true,
      });
      onResult(result);
      Stage("idle");
      success("Verified transfer record applied to this patient's scorecard.");
    });
  }
  if (stage === "idle")
    return (
      <button disabled={busy} onClick={start}>
        Retrieve verified transfer record
      </button>
    );
  return (
    <div className="notice lookup">
      <p>
        <strong>Fictional hospital B</strong> · resistance-relevant record
        lookup
      </p>
      <ul className="stage-list">
        <li className={stage !== "searching" ? "done" : ""}>
          {stage === "searching"
            ? "Contacting participating institution…"
            : "Institution contacted"}
        </li>
        <li
          className={
            stage === "ready" ? "done" : stage === "verifying" ? "" : "pending"
          }
        >
          {stage === "verifying"
            ? "Verifying record fingerprint…"
            : stage === "ready"
              ? "Record fingerprint verified"
              : "Verify record fingerprint"}
        </li>
      </ul>
      {stage === "ready" && (
        <button className="primary" disabled={busy} onClick={apply}>
          Apply verified record
        </button>
      )}
    </div>
  );
}
const SUGGESTED_QUESTIONS = [
  "Which evidence affected this score most?",
  "What information is still missing?",
  "Why is aged evidence weighted differently?",
];
function Explain({ api, patient, scenario, run, busy }) {
  const [open, Open] = useState(false),
    [question, Q] = useState(SUGGESTED_QUESTIONS[0]),
    [result, R] = useState(null),
    [err, Err] = useState("");
  function ask(q) {
    Q(q);
    Err("");
    run(async () => {
      try {
        R(
          await api("/explain", { patient_id: patient, scenario, question: q }),
        );
      } catch (e) {
        Err(e.message);
        R(null);
      }
    });
  }
  if (!open)
    return (
      <button onClick={() => Open(true)}>
        Ask Clinical Evidence Assistant
      </button>
    );
  return (
    <div className="notice explain">
      <p>
        <strong>Clinical Evidence Assistant</strong> — explains this scorecard
        only; it does not calculate the score.
      </p>
      <div className="actions">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button key={q} disabled={busy} onClick={() => ask(q)}>
            {q}
          </button>
        ))}
      </div>
      <label>
        Ask your own question
        <input
          value={question}
          onChange={(e) => Q(e.target.value)}
          maxLength={500}
        />
      </label>
      <button
        className="primary"
        disabled={busy || !question.trim()}
        onClick={() => ask(question)}
      >
        Ask
      </button>
      {err && (
        <p role="alert">
          {err} The deterministic scorecard above remains available.
        </p>
      )}
      {result && (
        <div className="ai-response">
          <h3>{result.title}</h3>
          <p>{result.summary}</p>
          {result.points?.length > 0 && (
            <ul>
              {result.points.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          )}
          {result.sources?.length > 0 && (
            <>
              <p className="muted">Sources</p>
              <ul className="sources">
                {result.sources.map((s, i) => (
                  <li key={i}>
                    {s.label}
                    {s.type ? " — " + s.type : ""}
                  </li>
                ))}
              </ul>
            </>
          )}
          {result.retrievedReferences?.length > 0 && (
            <details>
              <summary>Reference material retrieved</summary>
              <ul>
                {result.retrievedReferences.map((r) => (
                  <li key={r.id}>
                    {r.title} — {r.sourceLabel}
                  </li>
                ))}
              </ul>
            </details>
          )}
          <p className="muted">
            AI-generated explanation of a deterministic scorecard. The AI does
            not calculate the score.
            {result.provider
              ? " Answered by " + result.provider + " · " + result.model + "."
              : ""}
          </p>
        </div>
      )}
    </div>
  );
}
function Risk({ api, patient, state, run, busy, success }) {
  const [scenario, S] = useState(scenarios[0]),
    [data, D] = useState(null),
    [error, E] = useState("");
  useEffect(() => {
    let active = true;
    D(null);
    E("");
    api("/risk", { patient_id: patient, scenario })
      .then((x) => active && D(x))
      .catch((e) => active && E(e.message));
    return () => {
      active = false;
    };
  }, [patient, scenario, state.as_of]);
  return (
    <>
      <p>
        Illustrative resistance-risk scorecard. These authored scenarios are
        separate from extracted reports; scores are not clinical probabilities.
      </p>
      <Select
        label="Trap case"
        value={scenario}
        onChange={S}
        options={scenarios}
      />
      {error && <p role="alert">{error}</p>}
      {scenario === scenarios[2] && (
        <TransferLookup
          api={api}
          patient={patient}
          scenario={scenario}
          run={run}
          busy={busy}
          success={success}
          onResult={D}
        />
      )}
      {data && (
        <>
          <div className="scorecard-head">
            <div className="metric">
              <small>Baseline</small>
              <strong>
                {(data.prediction.baseline_score * 100).toFixed(0)}%
              </strong>
            </div>
            <RiskBadge score={data.prediction.final_score} />
          </div>
          <DataQualityFlags flags={data.prediction.data_quality_flags} />
          <div className="evidence-chain">
            {data.prediction.reasoning_chain.map((f, i) => (
              <EvidenceFactor f={f} key={f.source_event_id + i} />
            ))}
          </div>
          <p className="muted">{data.prediction.scope}</p>
          <details>
            <summary>Structured prediction</summary>
            <Json value={data.prediction} />
          </details>
          {data.lookup && (
            <div className="notice">
              <p>
                <strong>Verified provenance</strong> ·{" "}
                {data.lookup.state === "verified"
                  ? "fingerprint matched"
                  : data.lookup.state}
              </p>
              {data.lookup.institution && (
                <p>Source institution: {data.lookup.institution}</p>
              )}
              {data.lookup.sha256 && (
                <p className="code">
                  Fingerprint: {data.lookup.sha256.slice(0, 16)}…
                </p>
              )}
              <details>
                <summary>Full ledger receipt</summary>
                <Json value={data.lookup} />
              </details>
            </div>
          )}
          <Explain
            api={api}
            patient={patient}
            scenario={scenario}
            run={run}
            busy={busy}
          />
          <button onClick={() => save(data, "tracerx-scorecard.json")}>
            Download scorecard
          </button>
        </>
      )}
    </>
  );
}
function NumberField({ label, value, onChange, max = 80 }) {
  return (
    <label>
      {label}
      <input
        type="number"
        min="0"
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
function SyntheticModelLab({ api, run, busy }) {
  const [metadata, loadError] = useData(api, "/ml-demo/metadata"),
    [tab, T] = useState("Predict"),
    [form, F] = useState({
      organism: "Organism A",
      culture_description: "Synthetic urine",
      ordering_mode: "Routine",
      age_bucket: "41-65",
      gender: "Unknown",
      prior_organism_count: 1,
      days_since_prior_organism: 45,
      class_exposure_30d: 0,
      class_exposure_90d: 1,
      class_exposure_365d: 2,
      subtype_exposure_30d: 0,
      subtype_exposure_90d: 1,
      subtype_exposure_365d: 1,
    }),
    [candidates, C] = useState([
      "Antibiotic 1",
      "Antibiotic 2",
      "Antibiotic 3",
      "Antibiotic 4",
      "Antibiotic 5",
      "Antibiotic 6",
    ]),
    [ranking, R] = useState(null);
  const set = (key, value) => {
    F((current) => ({ ...current, [key]: value }));
    R(null);
  };
  const toggleCandidate = (candidate) => {
    C((current) =>
      current.includes(candidate)
        ? current.filter((item) => item !== candidate)
        : [...current, candidate],
    );
    R(null);
  };
  const exposureOrderValid =
    form.class_exposure_30d <= form.class_exposure_90d &&
    form.class_exposure_90d <= form.class_exposure_365d &&
    form.subtype_exposure_30d <= form.subtype_exposure_90d &&
    form.subtype_exposure_90d <= form.subtype_exposure_365d;
  if (loadError) return <p role="alert">{loadError}</p>;
  if (!metadata) return <p>Loading the synthetic teaching model...</p>;
  return (
    <>
      <div className="notice model-boundary">
        <strong>Separate, synthetic teaching model</strong>
        <p>
          This optional lab recreates the candidate-ranking workflow with a
          model trained entirely on fabricated rows. It is not hospital evidence
          and never changes the deterministic scorecard.
        </p>
      </div>
      <div className="tabs">
        {["Predict", "Model card"].map((name) => (
          <button
            key={name}
            className={tab === name ? "active" : ""}
            onClick={() => T(name)}
          >
            {name}
          </button>
        ))}
      </div>
      {tab === "Model card" ? (
        <>
          <h3>Held-out performance on fabricated data</h3>
          <p>
            These metrics measure only the generated test split. They do not
            establish clinical accuracy, transportability, or patient benefit.
          </p>
          <Metrics
            values={{
              "Synthetic train rows": metadata.metrics.n_train,
              "Synthetic test rows": metadata.metrics.n_test,
              AUROC: metadata.metrics.auroc,
              AUPRC: metadata.metrics.auprc,
              "Brier score": metadata.metrics.brier_score,
            }}
          />
          <details open>
            <summary>Known limitations</summary>
            <ul>
              <li>
                Every training row and label is fabricated by a seeded
                generator.
              </li>
              <li>
                Organisms and antibiotics are anonymous synthetic categories,
                not clinical names.
              </li>
              <li>
                The model estimates synthetic susceptibility, not clinical cure
                or treatment success.
              </li>
              <li>
                Results must not be used for diagnosis, prescribing, or patient
                care.
              </li>
            </ul>
          </details>
        </>
      ) : (
        <fieldset disabled={busy}>
          <div className="two model-layout">
            <section className="model-form">
              <h3>1. Patient and culture context</h3>
              <div className="two compact-grid">
                <Select
                  label="Synthetic organism"
                  value={form.organism}
                  onChange={(v) => set("organism", v)}
                  options={metadata.organisms}
                />
                <Select
                  label="Culture site"
                  value={form.culture_description}
                  onChange={(v) => set("culture_description", v)}
                  options={metadata.culture_descriptions}
                />
                <Select
                  label="Ordering mode"
                  value={form.ordering_mode}
                  onChange={(v) => set("ordering_mode", v)}
                  options={metadata.ordering_modes}
                />
                <Select
                  label="Age bucket"
                  value={form.age_bucket}
                  onChange={(v) => set("age_bucket", v)}
                  options={metadata.age_buckets}
                />
                <Select
                  label="Gender category"
                  value={form.gender}
                  onChange={(v) => set("gender", v)}
                  options={metadata.genders}
                />
              </div>

              <h3>2. Prior positive culture</h3>
              <p className="muted">
                Optional history features used by the fabricated training
                generator.
              </p>
              <div className="two compact-grid">
                <NumberField
                  label="Prior organism count"
                  value={form.prior_organism_count}
                  max={20}
                  onChange={(v) => set("prior_organism_count", v)}
                />
                <NumberField
                  label="Days since prior organism"
                  value={form.days_since_prior_organism}
                  max={720}
                  onChange={(v) => set("days_since_prior_organism", v)}
                />
              </div>

              <h3>3. Prior antibiotic exposure</h3>
              <p className="muted">
                Counts are cumulative; 30-day counts cannot exceed 90- or
                365-day counts.
              </p>
              <div className="exposure-grid">
                <NumberField
                  label="Class / 30d"
                  value={form.class_exposure_30d}
                  max={20}
                  onChange={(v) => set("class_exposure_30d", v)}
                />
                <NumberField
                  label="Class / 90d"
                  value={form.class_exposure_90d}
                  max={40}
                  onChange={(v) => set("class_exposure_90d", v)}
                />
                <NumberField
                  label="Class / 365d"
                  value={form.class_exposure_365d}
                  onChange={(v) => set("class_exposure_365d", v)}
                />
                <NumberField
                  label="Subtype / 30d"
                  value={form.subtype_exposure_30d}
                  max={20}
                  onChange={(v) => set("subtype_exposure_30d", v)}
                />
                <NumberField
                  label="Subtype / 90d"
                  value={form.subtype_exposure_90d}
                  max={40}
                  onChange={(v) => set("subtype_exposure_90d", v)}
                />
                <NumberField
                  label="Subtype / 365d"
                  value={form.subtype_exposure_365d}
                  onChange={(v) => set("subtype_exposure_365d", v)}
                />
              </div>
              {!exposureOrderValid && (
                <p role="alert" className="field-error">
                  Exposure counts must not decrease across time windows.
                </p>
              )}

              <h3>4. Candidate antibiotics</h3>
              <div className="actions compact-actions">
                <button type="button" onClick={() => C(metadata.antibiotics)}>
                  Select all
                </button>
                <button type="button" onClick={() => C([])}>
                  Clear
                </button>
              </div>
              <div className="candidate-grid">
                {metadata.antibiotics.map((candidate) => (
                  <Check
                    key={candidate}
                    checked={candidates.includes(candidate)}
                    onChange={() => toggleCandidate(candidate)}
                  >
                    {candidate}
                  </Check>
                ))}
              </div>
              <button
                className="primary rank-button"
                disabled={!candidates.length || !exposureOrderValid}
                onClick={() =>
                  run(async () =>
                    R(await api("/ml-demo/rank", { ...form, candidates })),
                  )
                }
              >
                Rank synthetic candidates
              </button>
            </section>
            <section className="model-results" aria-live="polite">
              <h3>Predicted synthetic susceptibility</h3>
              {!ranking ? (
                <div className="results-placeholder">
                  Choose at least one candidate and run the model to compare its
                  fabricated outputs.
                </div>
              ) : (
                <>
                  <ol className="ranking-list">
                    {ranking.results.map((row) => {
                      const percent = row.predicted_susceptibility * 100;
                      return (
                        <li key={row.antibiotic}>
                          <div className="rank-line">
                            <span>
                              <strong>#{row.rank}</strong> {row.antibiotic}
                            </span>
                            <strong>{percent.toFixed(1)}%</strong>
                          </div>
                          <div
                            className="probability-track"
                            aria-label={`${row.antibiotic}: ${percent.toFixed(1)} percent synthetic susceptibility`}
                          >
                            <span style={{ width: `${percent}%` }} />
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                  <p className="muted result-scope">{ranking.scope}</p>
                </>
              )}
            </section>
          </div>
        </fieldset>
      )}
    </>
  );
}
function Studio({ api, run, busy, setState, success }) {
  const [samples, error] = useData(api, "/samples"),
    [id, I] = useState(""),
    [mode, M] = useState("replay"),
    [text, T] = useState(""),
    [image, H] = useState(null),
    [consent, C] = useState(false),
    [pending, P] = useState(null),
    [event, V] = useState(""),
    [verified, F] = useState(false),
    [replace, R] = useState(false);
  const selected = id || samples?.[0]?.id;
  function clear() {
    P(null);
    F(false);
    R(false);
    C(false);
  }
  return (
    <>
      <p>
        Extract a synthetic source, inspect its structured fields, and verify it
        before import.
      </p>
      {error && <p role="alert">{error}</p>}
      <fieldset disabled={busy}>
        <Select
          label="Extraction mode"
          value={mode}
          onChange={(v) => {
            M(v);
            clear();
          }}
          options={[
            { value: "replay", label: "Demo image replay" },
            { value: "text", label: "Labeled text parser" },
            { value: "live", label: "Live VLM" },
          ]}
        />
        {samples && (
          <Select
            label="Synthetic sample"
            value={selected}
            onChange={(v) => {
              I(v);
              T(samples.find((s) => s.id === v).text);
              H(null);
              clear();
            }}
            options={samples.map((s) => ({ value: s.id, label: s.title }))}
          />
        )}{" "}
        {mode === "text" ? (
          <label>
            Source text
            <textarea
              rows={12}
              value={
                text || samples?.find((s) => s.id === selected)?.text || ""
              }
              onChange={(e) => {
                T(e.target.value);
                clear();
              }}
            />
          </label>
        ) : (
          <>
            <label>
              Or upload a synthetic PNG / JPEG (up to 8 MB)
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => {
                  clear();
                  H(null);
                  const f = e.target.files[0];
                  if (!f) return;
                  run(async () => {
                    if (f.size > 8 * 1024 * 1024)
                      throw Error("Image exceeds 8 MB.");
                    const data = await new Promise((resolve, reject) => {
                      const r = new FileReader();
                      r.onload = () => resolve(r.result.split(",")[1]);
                      r.onerror = () => reject(Error("Could not read image."));
                      r.readAsDataURL(f);
                    });
                    H(data);
                  });
                }}
              />
            </label>
            {selected && (
              <img
                className="source"
                alt="Selected synthetic source"
                src={
                  image
                    ? "data:image/png;base64," + image
                    : "/api/samples/" + selected + "/image"
                }
              />
            )}
          </>
        )}
        {mode === "live" && (
          <Check checked={consent} onChange={C}>
            This image is synthetic. I authorize sending it to the configured AI
            provider and incurring API usage.
          </Check>
        )}
        <button
          className="primary"
          disabled={mode === "live" && !consent}
          onClick={() =>
            run(async () => {
              P(null);
              F(false);
              const d = await api("/extract", {
                mode,
                sample_id: selected,
                text:
                  text || samples?.find((s) => s.id === selected)?.text || "",
                image_base64: image,
                consent,
              });
              P(d);
              V(pretty(d.document.event));
            })
          }
        >
          Extract source
        </button>
        {pending && (
          <>
            <h3>Verify extracted fields</h3>
            <p>
              Compare every value and evidence quote with the source. Missing
              evidence must be corrected in the source and extracted again.
            </p>
            <label>
              Structured event JSON
              <textarea
                className="code"
                rows={20}
                value={event}
                onChange={(e) => {
                  V(e.target.value);
                  F(false);
                }}
              />
            </label>
            <Check checked={verified} onChange={F}>
              I verified these fields against the synthetic source.
            </Check>
            <Check checked={replace} onChange={R}>
              Replace an existing event with the same identifier.
            </Check>
            <button
              className="primary"
              disabled={!verified}
              onClick={() =>
                run(async () => {
                  const d = await api("/import", {
                    attempt: pending.attempt,
                    event: JSON.parse(event),
                    verified,
                    replace,
                  });
                  setState(d);
                  P(null);
                  F(false);
                  success(
                    "Verified source imported. Review the updated patient workspace.",
                  );
                })
              }
            >
              Import verified event
            </button>
          </>
        )}
      </fieldset>
    </>
  );
}
function Connection({ api, state, setState, run, busy, success }) {
  const [key, K] = useState(""),
    [model, M] = useState(state.connection.model || "gpt-4.1-mini");
  return (
    <>
      <p>
        Your key is held only in the server’s temporary session and is excluded
        from exports. This browser tab keeps the session through a refresh for
        up to one hour. Use Forget connection to clear the key immediately.
      </p>
      <p className="muted">
        Saving verifies the key and selected model without transmitting a
        benchmark image. A live extraction is the final end-to-end check.
      </p>
      <fieldset disabled={busy}>
        <label>
          API key
          <input
            type="password"
            autoComplete="off"
            value={key}
            onChange={(e) => K(e.target.value)}
          />
        </label>
        <label>
          Vision-capable model
          <input value={model} onChange={(e) => M(e.target.value)} />
        </label>
        <div className="actions">
          <button
            className="primary"
            disabled={!key.trim() || !model.trim()}
            onClick={() =>
              run(async () => {
                const submittedKey = key;
                K("");
                try {
                  await api("/connection", {
                    api_key: submittedKey,
                    model: model.trim(),
                  });
                  success("Connection and model access verified.");
                } finally {
                  setState(await api("/state"));
                }
              })
            }
          >
            Save and verify connection
          </button>
          <button
            onClick={() =>
              run(async () => {
                await api("/connection", undefined, "DELETE");
                K("");
                setState(await api("/state"));
                success("Connection cleared.");
              })
            }
          >
            Forget connection
          </button>
        </div>
      </fieldset>
    </>
  );
}
function Evaluation({ api }) {
  const [d, e] = useData(api, "/evaluation");
  return (
    <>
      <p>
        Deterministic synthetic evaluation of the parser and review rules. This
        is separate from live vision-model accuracy.
      </p>
      {e && <p role="alert">{e}</p>}
      {d ? (
        <>
          <Metrics
            values={{
              "Rule accuracy": (100 * d.rule_accuracy).toFixed(0) + "%",
              "Field accuracy": (100 * d.field_accuracy).toFixed(0) + "%",
              "Exact documents":
                (100 * d.document_exact_match).toFixed(0) + "%",
            }}
          />
          <Table rows={d.rules} />
          <details>
            <summary>Extraction details</summary>
            <Table rows={d.extraction} />
          </details>
          <button onClick={() => save(d, "tracerx-evaluation.json")}>
            Download evaluation
          </button>
        </>
      ) : (
        <p>Running evaluation…</p>
      )}
    </>
  );
}
function Benchmark({ api, state, run, busy, download }) {
  const [rows, error] = useData(api, "/benchmark"),
    [split, S] = useState("development"),
    [ids, I] = useState([]),
    [consent, C] = useState(false),
    [result, R] = useState(null),
    [progress, G] = useState("");
  return (
    <>
      <p>
        Measure live extraction against authored synthetic ground truth. Each
        selected image makes a paid API call. Failed calls are reported
        separately and are not treated as model accuracy.
      </p>
      {error && <p role="alert">{error}</p>}
      <fieldset disabled={busy}>
        <Select
          label="Dataset split"
          value={split}
          onChange={(v) => {
            S(v);
            I([]);
            R(null);
            C(false);
          }}
          options={["development", "test"]}
        />
        <div className="choices">
          {rows
            ?.filter((r) => r.split === split)
            .map((r) => (
              <Check
                key={r.sample_id}
                checked={ids.includes(r.sample_id)}
                onChange={(v) => {
                  I(
                    v
                      ? [...ids, r.sample_id]
                      : ids.filter((x) => x !== r.sample_id),
                  );
                  C(false);
                }}
              >
                {r.sample_id}
              </Check>
            ))}
        </div>
        {ids[0] && (
          <details>
            <summary>Preview first selected image</summary>
            <img
              className="source"
              src={"/api/benchmark/" + ids[0] + "/image"}
              alt="Synthetic benchmark image"
            />
          </details>
        )}
        <Check checked={consent} onChange={C}>
          I authorize transmitting these synthetic images and the associated API
          charges.
        </Check>
        <button
          className="primary"
          disabled={!ids.length || !consent || !state.connection.configured}
          onClick={() =>
            run(async () => {
              R(null);
              for (let i = 0; i < ids.length; i++) {
                G("Processing image " + (i + 1) + " of " + ids.length);
                R(
                  await api("/benchmark/run", {
                    ids: [ids[i]],
                    consent,
                    restart: i === 0,
                  }),
                );
              }
              G("Run complete.");
            })
          }
        >
          Run {ids.length} images
        </button>
        <p role="status">{progress}</p>
        <p className="muted">
          Keep this page open during the run. A batch can take several minutes.
        </p>
      </fieldset>
      {result && (
        <>
          {result.failures > 0 && (
            <div className="notice warn" role="alert">
              <strong>
                {result.scored_documents === 0
                  ? "No accuracy result"
                  : "Some API requests failed"}
              </strong>
              <p>
                {result.scored_documents === 0
                  ? "The model returned no scoreable extraction. The percentages are withheld because this was an API failure, not a 0% extraction."
                  : `${result.failures} request(s) failed and were excluded from the accuracy calculation.`}
              </p>
              <ul>
                {result.results
                  .filter((r) => !r.success)
                  .map((r) => (
                    <li key={r.sample_id}>
                      <strong>{r.sample_id}</strong>: {r.error}
                      {r.error_type && ` (${r.error_type})`}
                    </li>
                  ))}
              </ul>
            </div>
          )}
          {result.scored_documents > 0 && (
            <Metrics
              values={{
                "Field accuracy":
                  (100 * result.field_accuracy).toFixed(1) + "%",
                "Non-null accuracy":
                  (100 * result.non_null_field_accuracy).toFixed(1) + "%",
                "Exact documents":
                  (100 * result.document_exact_match).toFixed(1) + "%",
                "Scored documents": result.scored_documents,
              }}
            />
          )}
          <Table
            rows={result.results.map((r) => ({
              Image: r.sample_id,
              Status: r.success ? "Scored" : "API failed",
              Seconds: r.seconds,
              Result: r.success
                ? r.fields.filter((f) => f.correct).length +
                  "/" +
                  r.fields.length +
                  " fields correct"
                : r.error,
            }))}
          />
          {result.results
            .filter((r) => r.success)
            .map((r) => (
              <details key={r.sample_id}>
                <summary>{r.sample_id}: field comparisons</summary>
                <Table rows={r.fields} />
              </details>
            ))}
          <button onClick={() => save(result, "vision-results.json")}>
            Download results
          </button>
        </>
      )}
      <button onClick={() => download("dataset")}>
        Download benchmark dataset
      </button>
    </>
  );
}
function About({ download }) {
  return (
    <>
      <p>
        TraceRx connects source evidence to explicit review tasks. Extraction
        proposes structured events; deterministic Python rules decide whether a
        source-verified final report needs review against an active order.
      </p>
      <p>
        Human review links a specific order to a specific report version. The
        separate resistance scorecard explores missing records, time decay, and
        illustrative persistence rules. The ledger uses fictional records and
        in-memory integrity checks.
      </p>
      <p>
        This prototype has no clinical validation, real hospital integration, or
        production identity system. All cases and benchmark images are
        synthetic.
      </p>
      <div className="actions">
        <button onClick={() => download("samples")}>
          Download synthetic samples
        </button>
        <a
          className="linkbutton"
          href="https://claude.ai/code/artifact/d80ddd76-fa51-4893-bcf3-38399fde7519?org=daaa9692-4acd-4c36-a3ee-78e27dda2988"
          target="_blank"
          rel="noreferrer"
        >
          Project overview
        </a>
      </div>
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
