// Pocket — shared file helpers for non-image tools (PDF, CSV…). Generic
// drag-and-drop zone + read/download utilities. DS primitives + tokens only.
import React from "react";
import { Icon } from "../../Pocket Design System/components/core/Icon.jsx";

export function formatBytes(n) {
  if (n == null || Number.isNaN(n)) return "—";
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / (1024 * 1024)).toFixed(2) + " MB";
}

export function readArrayBuffer(file) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(new Error("Could not read file")); r.readAsArrayBuffer(file); });
}
export function readText(file) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(new Error("Could not read file")); r.readAsText(file); });
}

export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function downloadText(text, name, type = "text/plain") { downloadBlob(new Blob([text], { type }), name); }

export function Dropzone({ onFiles, accept, multiple = false, icon = "upload", title = "Drop a file, or click to choose", hint, compact = false }) {
  const inputRef = React.useRef(null);
  const [over, setOver] = React.useState(false);
  const pick = (files) => { if (files && files.length) onFiles(multiple ? Array.from(files) : [files[0]]); };
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files); }}
      onClick={() => inputRef.current && inputRef.current.click()}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10,
        height: compact ? "auto" : "100%", minHeight: compact ? 0 : 220, padding: compact ? "20px 24px" : "32px 24px",
        textAlign: "center", cursor: "pointer",
        border: "2px dashed " + (over ? "var(--accent)" : "var(--border-default)"), borderRadius: "var(--radius-lg)",
        background: over ? "var(--accent-soft)" : "var(--surface-sunken)", transition: "border-color var(--duration-fast) var(--ease-out), background var(--duration-fast) var(--ease-out)",
      }}>
      <input ref={inputRef} type="file" accept={accept} multiple={multiple} onChange={(e) => { pick(e.target.files); e.target.value = ""; }} style={{ display: "none" }} />
      <Icon name={icon} size={compact ? 22 : 30} style={{ color: over ? "var(--text-accent)" : "var(--text-tertiary)" }} />
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>{title}</div>
      {hint ? <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{hint}</div> : null}
    </div>
  );
}
