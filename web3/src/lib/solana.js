import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  clusterApiUrl,
} from "@solana/web3.js";
import { merkleRootCached } from "./cad.js";
import {
  MEMO_PROGRAM_ID,
  encodeMemoBytes,
  explorerTxUrl,
  formatCadMemoMessage,
} from "./solana-memo.js";

export const CLUSTERS = ["devnet", "mainnet-beta"];

const MEMO_PK = new PublicKey(MEMO_PROGRAM_ID);

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function envCluster() {
  const raw =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_SOLANA_CLUSTER) || "devnet";
  return CLUSTERS.includes(raw) ? raw : "devnet";
}

function envRpc(cluster) {
  const override =
    typeof import.meta !== "undefined" ? import.meta.env?.VITE_SOLANA_RPC : undefined;
  if (override) return override;
  return clusterApiUrl(cluster);
}

export function defaultCluster() {
  return envCluster();
}

export function createConnection(cluster = defaultCluster(), rpcUrl) {
  const url = rpcUrl || envRpc(cluster);
  return new Connection(url, { commitment: "confirmed" });
}

function decodeBase58(str) {
  const bytes = [0];
  for (const ch of str) {
    const val = B58.indexOf(ch);
    if (val < 0) throw new Error("invalid base58 secret");
    let carry = val;
    for (let i = 0; i < bytes.length; i += 1) {
      carry += bytes[i] * 58;
      bytes[i] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (const ch of str) {
    if (ch !== "1") break;
    bytes.push(0);
  }
  return Uint8Array.from(bytes.reverse());
}

/** Decode base58 secret or JSON byte array. Never log or persist the raw secret. */
export function keypairFromSecretInput(raw) {
  const text = String(raw || "").trim();
  if (!text) throw new Error("empty secret");
  let bytes;
  if (text.startsWith("[")) {
    const arr = JSON.parse(text);
    if (!Array.isArray(arr) || arr.length < 32) throw new Error("invalid secret JSON");
    bytes = Uint8Array.from(arr);
  } else {
    bytes = decodeBase58(text);
  }
  if (bytes.length === 64) return Keypair.fromSecretKey(bytes);
  if (bytes.length === 32) return Keypair.fromSeed(bytes);
  throw new Error("secret must be 32-byte seed or 64-byte secret key");
}

export function detectBrowserWallet() {
  if (typeof window === "undefined") return null;
  const provider = window.solana;
  if (provider?.isPhantom || provider?.publicKey || provider?.connect) return provider;
  return null;
}

export async function connectBrowserWallet(provider = detectBrowserWallet()) {
  if (!provider) throw new Error("No Solana wallet found (install Phantom or use a paste key)");
  const res = await provider.connect();
  const pk = res?.publicKey ?? provider.publicKey;
  if (!pk) throw new Error("wallet connect returned no public key");
  return { provider, publicKey: new PublicKey(pk.toString()) };
}

function buildMemoTx(payer, message, blockhash, lastValidBlockHeight) {
  return new Transaction({
    feePayer: payer,
    blockhash,
    lastValidBlockHeight,
  }).add(
    new TransactionInstruction({
      keys: [{ pubkey: payer, isSigner: true, isWritable: false }],
      programId: MEMO_PK,
      data: encodeMemoBytes(message),
    }),
  );
}

async function prepareCommitment(cad, dag) {
  const cids = Object.keys(cad);
  const cadRoot = await merkleRootCached(cids);
  const tip = dag.nodes.length ? dag.nodes[dag.nodes.length - 1].id : "genesis";
  const message = formatCadMemoMessage({
    cadRoot,
    dagTip: tip,
    cidCount: cids.length,
  });
  return { cids, cadRoot, tip, message };
}

function resultShape({ signature, cadRoot, tip, cids, message, cluster }) {
  return {
    signature,
    cadRoot,
    dagTip: tip,
    cidCount: cids.length,
    message,
    cluster,
    explorerUrl: explorerTxUrl(signature, cluster),
    at: new Date().toISOString(),
  };
}

/**
 * Memo-only tx: getLatestBlockhash once → sign → sendRaw → confirm.
 * No rent-exempt accounts; fee is base signature cost only (~5k lamports).
 */
export async function commitCadRootWithKeypair({
  connection,
  cluster,
  cad,
  dag,
  keypair,
}) {
  const prepared = await prepareCommitment(cad, dag);
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const tx = buildMemoTx(
    keypair.publicKey,
    prepared.message,
    blockhash,
    lastValidBlockHeight,
  );
  tx.partialSign(keypair);
  const signature = await connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    preflightCommitment: "confirmed",
    maxRetries: 2,
  });
  await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed",
  );
  return resultShape({ signature, cluster, ...prepared });
}

export async function commitCadRootWithWallet({
  connection,
  cluster,
  cad,
  dag,
  provider,
  publicKey,
}) {
  const prepared = await prepareCommitment(cad, dag);
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const tx = buildMemoTx(publicKey, prepared.message, blockhash, lastValidBlockHeight);

  let signature;
  if (provider.signAndSendTransaction) {
    const out = await provider.signAndSendTransaction(tx);
    signature = typeof out === "string" ? out : out.signature;
  } else {
    const signed = await provider.signTransaction(tx);
    signature = await connection.sendRawTransaction(signed.serialize(), {
      skipPreflight: false,
      preflightCommitment: "confirmed",
      maxRetries: 2,
    });
  }

  await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed",
  );
  return resultShape({ signature, cluster, ...prepared });
}

export async function requestDevnetAirdrop(connection, publicKey, sol = 1) {
  const pk = publicKey instanceof PublicKey ? publicKey : new PublicKey(publicKey);
  const sig = await connection.requestAirdrop(pk, Math.floor(sol * 1e9));
  const latest = await connection.getLatestBlockhash("confirmed");
  await connection.confirmTransaction({ signature: sig, ...latest }, "confirmed");
  return sig;
}

export async function getBalanceSol(connection, publicKey) {
  const pk = publicKey instanceof PublicKey ? publicKey : new PublicKey(publicKey);
  return (await connection.getBalance(pk)) / 1e9;
}
