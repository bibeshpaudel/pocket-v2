// Pocket — CSV engine facade. Talks to the Web Worker when available and falls
// back to a yield-then-run on the main thread otherwise, so every CSV tool gets
// the same promise API: runCsv(op, payload, onProgress) -> Promise<result>.
import { runJob } from "./csv-shared.js";

let worker = null;
let workerBroken = false;
let seq = 0;
const pending = new Map();

function getWorker() {
  if (worker || workerBroken) return worker;
  if (typeof Worker === "undefined") { workerBroken = true; return null; }
  try {
    worker = new Worker(new URL("./csv-worker.js", import.meta.url), { type: "module" });
    worker.onmessage = (e) => {
      const { id, type, value, result, message } = e.data || {};
      const entry = pending.get(id);
      if (!entry) return;
      if (type === "progress") { if (entry.onProgress) entry.onProgress(value); }
      else if (type === "done") { pending.delete(id); entry.resolve(result); }
      else if (type === "error") { pending.delete(id); entry.reject(new Error(message)); }
    };
    worker.onerror = () => {
      // Worker construction/runtime failed — give up on it and reject in-flight
      // jobs so callers can retry on the main-thread fallback.
      workerBroken = true;
      for (const [, entry] of pending) entry.reject(new Error("worker-failed"));
      pending.clear();
      try { worker.terminate(); } catch (e) { /* ignore */ }
      worker = null;
    };
  } catch (e) {
    workerBroken = true;
    worker = null;
  }
  return worker;
}

function runOnMainThread(op, payload, onProgress) {
  // Yield once so React can paint the "working" state before we block.
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try { resolve(runJob(op, payload, onProgress)); }
      catch (e) { reject(e); }
    }, 0);
  });
}

export function runCsv(op, payload, onProgress) {
  const w = getWorker();
  if (!w) return runOnMainThread(op, payload, onProgress);
  const id = ++seq;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, onProgress });
    try {
      w.postMessage({ id, op, payload });
    } catch (e) {
      pending.delete(id);
      // Most likely a structured-clone failure — fall back to the main thread.
      runOnMainThread(op, payload, onProgress).then(resolve, reject);
    }
  }).catch((err) => {
    if (err && err.message === "worker-failed") return runOnMainThread(op, payload, onProgress);
    throw err;
  });
}

// Hard-cancel everything in flight (used when the user loads a new file).
export function cancelCsv() {
  if (worker) {
    try { worker.terminate(); } catch (e) { /* ignore */ }
    worker = null;
  }
  for (const [, entry] of pending) entry.reject(new Error("cancelled"));
  pending.clear();
  workerBroken = false; // let the next call rebuild a fresh worker
}
