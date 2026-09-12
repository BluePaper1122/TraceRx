import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
const pages = [
  "Start here",
  "Overview",
  "Patient workspace",
  "Document studio",
  "Evaluation lab",
  "AI connection",
  "Vision benchmark",
  "About & demo",
];
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
function App() {
  const [token, T] = useState(""),
    [state, S] = useState(null),
    [page, P] = useState(pages[0]),
    [busy, B] = useState(false),
    [error, E] = useState(""),
    [success, U] = useState(""),
    [reset, R] = useState(false),
    [menu, M] = useState(false);
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
      let sessionToken = sessionStorage.getItem("resistlens-session");
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
          sessionStorage.removeItem("resistlens-session");
        }
      }
      const created = await api("/session", {});
      sessionToken = created.token;
      const fresh = await api("/state", undefined, "GET", false, sessionToken);
      if (active) {
        sessionStorage.setItem("resistlens-session", sessionToken);
        T(sessionToken);
        S(fresh);
      }
    }
    start().catch((e) => E(e.message));
    return () => {
      active = false;
    };
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
        "resistlens-" +
          kind +
          (kind === "session" ? ".json" : kind === "queue" ? ".csv" : ".zip"),
      ),
    );
  const ctx = { api, state, setState: S, run, busy, success: U, download };
  return (
    <>
      <button className="menu" onClick={() => M(!menu)}>
        ☰ Navigation
      </button>
      <aside className={menu ? "open" : ""}>
        <h2>ResistLens</h2>
        <p className="muted">Evidence review workspace</p>
        <nav>
          {pages.map((p) => (
            <button
              disabled={busy}
              className={page === p ? "active" : ""}
              key={p}
              onClick={() => {
                P(p);
                M(false);
                E("");
                U("");
              }}
            >
              {p}
            </button>
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
            <Check checked={reset} onChange={R}>
              Confirm session reset
            </Check>
            <button
              disabled={!reset || busy}
              onClick={() =>
                run(async () => {
                  await api("/session", undefined, "DELETE");
                  sessionStorage.removeItem("resistlens-session");
                  location.reload();
                })
              }
            >
              Reset synthetic session
            </button>
          </>
        )}
      </aside>
      <main>
        <header className="hero">
          <small>RESISTLENS · EVIDENCE REVIEW</small>
          <h1>Close the evidence-to-review gap.</h1>
          <p>
            Bring source evidence, deterministic checks, and human review into
            one workspace.
          </p>
          <div className="tags">
            <span>Source provenance</span>
            <span>Deterministic rules</span>
            <span>Human verification</span>
          </div>
        </header>
        <p className="disclaimer">
          Synthetic demonstration only. No real patient data. Not a diagnostic
          or treatment recommendation tool.
        </p>
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
          <p>Loading workspace…</p>
        ) : (
          <>
            <h2>{page}</h2>
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
            ) : (
              <About {...ctx} />
            )}
          </>
        )}
      </main>
    </>
  );
}
function Guide({ api }) {
  const [step, set] = useState(0),
    [data, error] = useData(api, "/guide/" + step);
  return (
    <>
      <p>
        Follow one synthetic case from new evidence to a source-linked review.
      </p>
      <div className="tabs">
        {[
          "Before the result",
          "Final result arrives",
          "Record a review",
          "Evidence trail",
        ].map((s, i) => (
          <button
            className={step === i ? "active" : ""}
            key={s}
            onClick={() => set(i)}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>
      {error && <p role="alert">{error}</p>}
      {data && (
        <>
          <Findings items={data.findings} />
          <p>
            {step === 0
              ? "An active order exists, but the final result has not arrived."
              : step === 1
                ? "A final report arrived after the order started. A review is now due."
                : step === 2
                  ? "This guided example simulates a review linked to the specific order and report."
                  : "The source documents and explicit links make the decision traceable."}
          </p>
          {data.documents.map((d) => (
            <details key={d.document_id}>
              <summary>{d.title}</summary>
              <pre>{d.text}</pre>
              <Json value={d.event} />
            </details>
          ))}
        </>
      )}
    </>
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
function Risk({ api, patient, state, run, busy }) {
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
        <button
          disabled={busy}
          onClick={() =>
            run(async () =>
              D(
                await api("/risk", {
                  patient_id: patient,
                  scenario,
                  lookup: true,
                }),
              ),
            )
          }
        >
          Look up fictional transfer record
        </button>
      )}
      {data && (
        <>
          <Metrics
            values={{
              "Baseline score": data.prediction.baseline_score.toFixed(2),
              "Final score": data.prediction.final_score.toFixed(2),
            }}
          />
          <p>{data.prediction.data_quality_flags.join(" · ")}</p>
          <Table rows={data.prediction.reasoning_chain} />
          <details>
            <summary>Structured prediction</summary>
            <Json value={data.prediction} />
          </details>
          {data.lookup && (
            <details>
              <summary>Mock ledger receipt</summary>
              <Json value={data.lookup} />
            </details>
          )}
          <button onClick={() => save(data, "resistlens-scorecard.json")}>
            Download scorecard
          </button>
        </>
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
          <button onClick={() => save(d, "resistlens-evaluation.json")}>
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
        ResistLens connects source evidence to explicit review tasks. Extraction
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
      <button onClick={() => download("samples")}>
        Download synthetic samples
      </button>
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
