import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { appendDagNode, emptyDag } from "./lib/dag.js";
import { continuityPrompt, retrieveForPatient } from "./lib/rag.js";
import {
  commitCadRoot,
  emptySolanaLocal,
  recordOnChainCommitment,
} from "./lib/solana-local.js";
import { PublicKey } from "@solana/web3.js";
import {
  CLUSTERS,
  commitCadRootWithKeypair,
  commitCadRootWithWallet,
  connectBrowserWallet,
  createConnection,
  defaultCluster,
  detectBrowserWallet,
  getBalanceSol,
  keypairFromSecretInput,
  requestDevnetAirdrop,
} from "./lib/solana.js";
import { explorerAddressUrl } from "./lib/solana-memo.js";
import {
  captureEmbedding,
  clearPersona,
  embeddingDistance,
  enrollPersona,
  loadVault,
  lockVault,
  setCadRoot,
  unlockWithFace,
} from "./lib/tee.js";

const CAD_KEY = "resistlens.web3.cad.v1";
const DAG_KEY = "resistlens.web3.dag.v1";
const SOL_KEY = "resistlens.web3.sol.v1";
const CLUSTER_KEY = "resistlens.web3.cluster.v1";

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function rebuildDag(nodes) {
  return { nodes, byId: Object.fromEntries(nodes.map((n) => [n.id, n])) };
}

function DoctorGate({ vault, setVault, children }) {
  const videoRef = useRef(null);
  const [name, setName] = useState("Dr. Chen");
  const [status, setStatus] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (vault.sessionUnlocked) return undefined;
    let stream;
    let cancelled = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch {
        setStatus("Allow webcam to enroll / unlock the local TEE.");
      }
    })();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [vault.sessionUnlocked]);

  if (vault.sessionUnlocked) return children;

  const hasPersona = Boolean(vault.persona);

  return (
    <div className="gate">
      <div className="gate-box">
        <p className="badge" style={{ color: "#9fd8d1" }}>
          ResistLens Web3 · local TEE
        </p>
        <h1>Doctor persona unlock</h1>
        <p style={{ opacity: 0.8 }}>
          Face template sealed in this browser vault. Nothing is uploaded.
        </p>
        <video ref={videoRef} muted playsInline />
        {!hasPersona ? (
          <>
            <label>Display name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
            <button
              disabled={!ready || busy || !name.trim()}
              onClick={() => {
                void (async () => {
                  setBusy(true);
                  try {
                    const face = await captureEmbedding(videoRef.current);
                    setVault(
                      enrollPersona(loadVault(), {
                        id: `doc-${Date.now()}`,
                        displayName: name.trim(),
                        role: "Attending",
                        hospitalId: "riverside",
                        faceTemplate: face,
                      }),
                    );
                    setStatus("Persona sealed.");
                  } catch (error) {
                    setStatus(error.message);
                  } finally {
                    setBusy(false);
                  }
                })();
              }}
            >
              Enroll face in TEE
            </button>
          </>
        ) : (
          <>
            <p>Welcome back, {vault.persona.displayName}.</p>
            <div className="row">
              <button
                disabled={!ready || busy}
                onClick={() => {
                  void (async () => {
                    setBusy(true);
                    try {
                      const face = await captureEmbedding(videoRef.current);
                      const distance = embeddingDistance(
                        vault.persona.faceTemplate,
                        face,
                      );
                      const next = unlockWithFace(loadVault(), face);
                      setVault(next);
                      setStatus(
                        next.sessionUnlocked
                          ? `Match OK · distance ${distance.toFixed(3)}`
                          : `No match · distance ${distance.toFixed(3)}`,
                      );
                    } catch (error) {
                      setStatus(error.message);
                    } finally {
                      setBusy(false);
                    }
                  })();
                }}
              >
                Unlock with face
              </button>
              <button
                className="secondary"
                onClick={() => setVault(clearPersona(loadVault()))}
              >
                Clear persona
              </button>
            </div>
          </>
        )}
        {status ? <p style={{ opacity: 0.75 }}>{status}</p> : null}
      </div>
    </div>
  );
}

export function App() {
  const [vault, setVault] = useState(() => loadVault());
  const [cad, setCad] = useState(() => loadJson(CAD_KEY, {}));
  const [dag, setDag] = useState(() => {
    const loaded = loadJson(DAG_KEY, { nodes: [] });
    return rebuildDag(loaded.nodes);
  });
  const [solana, setSolana] = useState(() => loadJson(SOL_KEY, emptySolanaLocal()));
  const [cluster, setCluster] = useState(() => {
    const saved = loadJson(CLUSTER_KEY, null);
    return CLUSTERS.includes(saved) ? saved : defaultCluster();
  });
  const [walletMode, setWalletMode] = useState("none"); // none | phantom | ephemeral
  const [pubkey, setPubkey] = useState("");
  const [balance, setBalance] = useState(null);
  const [secretDraft, setSecretDraft] = useState("");
  const [ephemeral, setEphemeral] = useState(null);
  const [walletProvider, setWalletProvider] = useState(null);
  const [solStatus, setSolStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastTx, setLastTx] = useState(() => solana.lastOnChain || null);

  useEffect(() => saveJson(CAD_KEY, cad), [cad]);
  useEffect(() => saveJson(DAG_KEY, { nodes: dag.nodes }), [dag]);
  useEffect(() => saveJson(SOL_KEY, solana), [solana]);
  useEffect(() => saveJson(CLUSTER_KEY, cluster), [cluster]);

  const rag = useMemo(
    () => continuityPrompt(retrieveForPatient(dag, cad, "10")),
    [dag, cad],
  );

  const connection = useMemo(() => createConnection(cluster), [cluster]);
  const hasPhantom = Boolean(detectBrowserWallet());

  async function refreshBalance(pk) {
    if (!pk) {
      setBalance(null);
      return;
    }
    try {
      const sol = await getBalanceSol(connection, pk);
      setBalance(sol);
    } catch {
      setBalance(null);
    }
  }

  useEffect(() => {
    if (pubkey) void refreshBalance(pubkey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pubkey, cluster, connection]);

  function applyCommitBatch({ nextDag, nextCad, nextSolana, commitment }) {
    startTransition(() => {
      if (nextDag) setDag(nextDag);
      if (nextCad) setCad(nextCad);
      setSolana(nextSolana);
      setVault(setCadRoot(loadVault(), commitment.cadRoot, commitment.slot));
      if (commitment.mode === "solana") setLastTx(commitment);
    });
  }

  async function persistLocal(nextDag, nextCad) {
    const { state, commitment } = await commitCadRoot(solana, nextCad, nextDag);
    applyCommitBatch({ nextDag, nextCad, nextSolana: state, commitment });
  }

  async function commitLocalOnly() {
    setBusy(true);
    setSolStatus("Writing local CAD root…");
    try {
      const { state, commitment } = await commitCadRoot(solana, cad, dag);
      applyCommitBatch({ nextSolana: state, commitment });
      setSolStatus(`Local commit · ${commitment.signature}`);
    } catch (error) {
      setSolStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function commitOnSolana() {
    setBusy(true);
    setSolStatus(`Submitting memo on ${cluster}…`);
    try {
      let onChain;
      if (walletMode === "ephemeral" && ephemeral) {
        onChain = await commitCadRootWithKeypair({
          connection,
          cluster,
          cad,
          dag,
          keypair: ephemeral,
        });
      } else if (walletMode === "phantom" && walletProvider && pubkey) {
        onChain = await commitCadRootWithWallet({
          connection,
          cluster,
          cad,
          dag,
          provider: walletProvider,
          publicKey: new PublicKey(pubkey),
        });
      } else {
        throw new Error("Connect Phantom or import an ephemeral key first");
      }
      const { state, commitment } = recordOnChainCommitment(solana, onChain);
      applyCommitBatch({ nextSolana: state, commitment });
      setLastTx(commitment);
      setSolStatus(`On-chain · ${onChain.signature}`);
      await refreshBalance(pubkey);
    } catch (error) {
      setSolStatus(error.message || String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <DoctorGate vault={vault} setVault={setVault}>
      <div className="app">
        <div className="hero">
          <p className="badge">Additive Web3 module · Streamlit core untouched</p>
          <h1>ResistLens Web3</h1>
          <p>
            Local TEE · CAD · DAG · RAG · Solana memo commitments (root + metadata only — no
            PHI).
          </p>
        </div>

        <div className="grid">
          <div className="card">
            <h2>TEE attestation</h2>
            <p className="mono">{vault.attestation}</p>
            <p>{vault.persona?.displayName}</p>
          </div>
          <div className="card">
            <h2>CAD objects</h2>
            <p style={{ fontSize: "1.6rem", margin: 0 }}>{Object.keys(cad).length}</p>
          </div>
          <div className="card">
            <h2>DAG events</h2>
            <p style={{ fontSize: "1.6rem", margin: 0 }}>{dag.nodes.length}</p>
          </div>
          <div className="card">
            <h2>Commitment slot</h2>
            <p style={{ fontSize: "1.6rem", margin: 0 }}>{solana.slot}</p>
            <p className="mono">root {(vault.cadRoot ?? "—").slice(0, 16)}</p>
          </div>
        </div>

        <div className="card solana-panel" style={{ marginTop: "1rem" }}>
          <h2>Solana · CAD merkle memo</h2>
          <p className="hint">
            Stores only <code>RL1|&lt;root&gt;|&lt;tip&gt;|&lt;n&gt;</code> via the Memo program.
            Payloads stay in the local CAD vault. Prefer <strong>devnet</strong> (free airdrop);
            use mainnet-beta only for a final demo commit — fees are tiny (~0.000005 SOL).
          </p>

          <div className="row">
            <label className="inline">
              Cluster
              <select
                value={cluster}
                onChange={(e) => {
                  setCluster(e.target.value);
                  setSolStatus("");
                }}
              >
                {CLUSTERS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            {pubkey ? (
              <span className="mono">
                {pubkey.slice(0, 4)}…{pubkey.slice(-4)}
                {balance != null ? ` · ${balance.toFixed(4)} SOL` : ""}
              </span>
            ) : (
              <span className="hint">No signer</span>
            )}
          </div>

          <div className="row">
            <button
              className="secondary"
              disabled={busy || !hasPhantom}
              onClick={() => {
                void (async () => {
                  setBusy(true);
                  try {
                    const { provider, publicKey } = await connectBrowserWallet();
                    setWalletProvider(provider);
                    setEphemeral(null);
                    setSecretDraft("");
                    setWalletMode("phantom");
                    setPubkey(publicKey.toBase58());
                    setSolStatus("Phantom connected");
                  } catch (error) {
                    setSolStatus(error.message);
                  } finally {
                    setBusy(false);
                  }
                })();
              }}
            >
              Connect Phantom
            </button>
            {cluster === "devnet" && pubkey ? (
              <button
                className="secondary"
                disabled={busy}
                onClick={() => {
                  void (async () => {
                    setBusy(true);
                    setSolStatus("Requesting 1 SOL airdrop…");
                    try {
                      await requestDevnetAirdrop(connection, pubkey, 1);
                      await refreshBalance(pubkey);
                      setSolStatus("Airdrop confirmed");
                    } catch (error) {
                      setSolStatus(error.message || "Airdrop failed (rate limit?)");
                    } finally {
                      setBusy(false);
                    }
                  })();
                }}
              >
                Devnet airdrop 1 SOL
              </button>
            ) : null}
          </div>

          <details className="secret-box">
            <summary>Paste ephemeral secret (hackathon demo — never commit)</summary>
            <p className="warn">
              Warning: pasting a private key into a browser is unsafe outside a throwaway demo
              key. Prefer Phantom. Secrets are kept in memory only and never written to
              localStorage.
            </p>
            <textarea
              rows={2}
              placeholder="base58 secret or JSON byte array"
              value={secretDraft}
              onChange={(e) => setSecretDraft(e.target.value)}
            />
            <div className="row">
              <button
                className="secondary"
                disabled={busy || !secretDraft.trim()}
                onClick={() => {
                  try {
                    const kp = keypairFromSecretInput(secretDraft);
                    setEphemeral(kp);
                    setWalletProvider(null);
                    setWalletMode("ephemeral");
                    setPubkey(kp.publicKey.toBase58());
                    setSecretDraft("");
                    setSolStatus("Ephemeral key loaded in memory");
                  } catch (error) {
                    setSolStatus(error.message);
                  }
                }}
              >
                Import key
              </button>
              <button
                className="secondary"
                disabled={!ephemeral}
                onClick={() => {
                  setEphemeral(null);
                  if (walletMode === "ephemeral") {
                    setWalletMode("none");
                    setPubkey("");
                  }
                  setSolStatus("Ephemeral key cleared");
                }}
              >
                Clear key
              </button>
            </div>
            {pubkey ? (
              <p className="mono">
                <a
                  href={explorerAddressUrl(pubkey, cluster)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Explorer address
                </a>
              </p>
            ) : null}
          </details>

          <div className="row">
            <button disabled={busy || !pubkey} onClick={() => void commitOnSolana()}>
              Commit CAD root to Solana
            </button>
            <button className="secondary" disabled={busy} onClick={() => void commitLocalOnly()}>
              Local fallback commit
            </button>
          </div>

          {solStatus ? <p className="hint">{solStatus}</p> : null}
          {lastTx?.signature ? (
            <div className="tx-result">
              <p className="mono">sig {lastTx.signature}</p>
              {lastTx.explorerUrl ? (
                <a href={lastTx.explorerUrl} target="_blank" rel="noreferrer">
                  Open in Solana Explorer
                </a>
              ) : null}
              {lastTx.message ? <p className="mono">memo {lastTx.message}</p> : null}
            </div>
          ) : null}
        </div>

        <div className="row">
          <button
            disabled={busy}
            onClick={() => {
              void (async () => {
                setBusy(true);
                try {
                  let d = emptyDag();
                  let c = {};
                  ({ dag: d, cad: c } = await appendDagNode(d, c, {
                    kind: "doc_gap",
                    label: "Missing outside records on transfer intake",
                    payload: { gap: "unavailable" },
                    patientId: "10",
                  }));
                  ({ dag: d, cad: c } = await appendDagNode(d, c, {
                    kind: "handoff",
                    label: "ED → ICU incomplete med list",
                    payload: { missing: ["vasopressor rate"] },
                    patientId: "2",
                  }));
                  ({ dag: d, cad: c } = await appendDagNode(d, c, {
                    kind: "immunity_score",
                    label: "Immunity module scored #2",
                    payload: {
                      ceftriaxone: 0.8,
                      ciprofloxacin: 0.75,
                      pipTazo: 0.38,
                      meropenem: 0.1,
                    },
                    patientId: "2",
                  }));
                  ({ dag: d, cad: c } = await appendDagNode(d, c, {
                    kind: "immunity_score",
                    label: "Immunity waiting on unavailable file #10",
                    payload: { status: "unavailable_not_negative" },
                    patientId: "10",
                  }));
                  await persistLocal(d, c);
                  setSolStatus("Seeded CAD/DAG + local root");
                } catch (error) {
                  setSolStatus(error.message);
                } finally {
                  setBusy(false);
                }
              })();
            }}
          >
            Seed CAD / DAG
          </button>
          <button className="secondary" onClick={() => setVault(lockVault(loadVault()))}>
            Lock TEE
          </button>
        </div>

        <div className="card" style={{ marginTop: "1rem" }}>
          <h2>DAG tip → parents</h2>
          <div className="list">
            {[...dag.nodes].reverse().slice(0, 8).map((node) => (
              <div className="item" key={node.id}>
                <strong>[{node.kind}]</strong> {node.label}
                <div className="mono">
                  {node.id} · cad {node.cadCid.slice(0, 12)}… · parents{" "}
                  {node.parentIds.join(", ") || "genesis"}
                </div>
              </div>
            ))}
            {!dag.nodes.length ? <p>Empty — seed the graph.</p> : null}
          </div>
        </div>

        <div className="card" style={{ marginTop: "1rem" }}>
          <h2>RAG over CAD/DAG · patient #10</h2>
          <pre>{rag}</pre>
        </div>
      </div>
    </DoctorGate>
  );
}
