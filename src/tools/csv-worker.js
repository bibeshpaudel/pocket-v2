// Pocket — CSV Web Worker. Runs the heavy parse/convert jobs off the main thread
// so large files never freeze the UI. Protocol: { id, op, payload } in →
// { id, type: "progress"|"done"|"error", ... } out.
import { runJob } from "./csv-shared.js";

self.onmessage = (e) => {
  const { id, op, payload } = e.data || {};
  try {
    const result = runJob(op, payload, (value) => {
      self.postMessage({ id, type: "progress", value });
    });
    self.postMessage({ id, type: "done", result });
  } catch (err) {
    self.postMessage({ id, type: "error", message: (err && err.message) || "CSV processing failed" });
  }
};
