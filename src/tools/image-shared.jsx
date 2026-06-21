// Pocket — shared helpers for the Image tools (compressor, converter, viewer,
// analyzer). All client-side: File API + canvas, nothing uploaded. DS + tokens.
import React from "react";
import { Icon } from "../../Pocket Design System/components/core/Icon.jsx";

export function formatBytes(n) {
  if (n == null || Number.isNaN(n)) return "—";
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / (1024 * 1024)).toFixed(2) + " MB";
}

export function readAsDataURL(file) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(new Error("Could not read file")); r.readAsDataURL(file); });
}
export function readAsArrayBuffer(file) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(new Error("Could not read file")); r.readAsArrayBuffer(file); });
}
export function readAsText(file) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(new Error("Could not read file")); r.readAsText(file); });
}
export function loadImage(src) {
  return new Promise((res, rej) => { const img = new Image(); img.onload = () => res(img); img.onerror = () => rej(new Error("Could not decode image")); img.src = src; });
}

export function isHeic(file) {
  return /image\/hei[cf]/i.test(file.type || "") || /\.(heic|heif)$/i.test(file.name || "");
}

// Browsers (except Safari) can't decode HEIC/HEIF in <img>/canvas. When needed,
// decode to a PNG File — lazy-loaded so the WASM only downloads when a HEIC is
// actually opened. Primary decoder is `heic-to` (modern libheif — handles recent
// 10-bit/HDR iPhone photos); `heic2any` (older libheif) is a fallback. Non-HEIC
// files pass through untouched.
async function decodeWithHeicTo(file) {
  const { heicTo } = await import("heic-to");
  return heicTo({ blob: file, type: "image/png" });
}
async function decodeWithHeic2any(file) {
  const heic2any = (await import("heic2any")).default;
  const blob = await heic2any({ blob: file, toType: "image/png" });
  return Array.isArray(blob) ? blob[0] : blob;
}
export async function ensureDecodable(file) {
  if (!isHeic(file)) return file;
  let out;
  try {
    out = await decodeWithHeicTo(file);
  } catch (primaryErr) {
    try { out = await decodeWithHeic2any(file); }
    catch (fallbackErr) { throw new Error("Couldn't decode this HEIC image — the format may be unsupported (e.g. an unusual codec profile)."); }
  }
  return new File([out], (file.name || "image").replace(/\.(heic|heif)$/i, "") + ".png", { type: "image/png" });
}

export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadText(text, name, type = "text/plain") {
  downloadBlob(new Blob([text], { type }), name);
}

// Re-encode an <img> through a canvas. scale 0–1, returns a Blob.
export function encodeImage(img, mime, quality, scale = 1) {
  return new Promise((res, rej) => {
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (mime === "image/jpeg") { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h); } // flatten alpha
    ctx.drawImage(img, 0, 0, w, h);
    canvas.toBlob((blob) => blob ? res({ blob, width: w, height: h }) : rej(new Error("Encoding failed — format may be unsupported")), mime, quality);
  });
}

export function Dropzone({ onFile, accept = "image/*,.heic,.heif", icon = "image-up", title = "Drop an image, or click to choose", hint }) {
  const inputRef = React.useRef(null);
  const [over, setOver] = React.useState(false);
  const pick = (files) => { if (files && files.length) onFile(files[0]); };
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files); }}
      onClick={() => inputRef.current && inputRef.current.click()}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10,
        height: "100%", minHeight: 220, padding: "32px 24px", textAlign: "center", cursor: "pointer",
        border: "2px dashed " + (over ? "var(--accent)" : "var(--border-default)"), borderRadius: "var(--radius-lg)",
        background: over ? "var(--accent-soft)" : "var(--surface-sunken)", transition: "border-color var(--duration-fast) var(--ease-out), background var(--duration-fast) var(--ease-out)",
      }}>
      <input ref={inputRef} type="file" accept={accept} onChange={(e) => { pick(e.target.files); e.target.value = ""; }} style={{ display: "none" }} />
      <Icon name={icon} size={30} style={{ color: over ? "var(--text-accent)" : "var(--text-tertiary)" }} />
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>{title}</div>
      {hint ? <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{hint}</div> : null}
    </div>
  );
}

// Checkerboard backdrop so transparency reads clearly behind previews.
export const CHECKER = {
  backgroundImage:
    "linear-gradient(45deg, var(--surface-hover) 25%, transparent 25%), linear-gradient(-45deg, var(--surface-hover) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--surface-hover) 75%), linear-gradient(-45deg, transparent 75%, var(--surface-hover) 75%)",
  backgroundSize: "18px 18px",
  backgroundPosition: "0 0, 0 9px, 9px -9px, -9px 0",
};

export function Stat({ label, value, accent }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-tertiary)" }}>{label}</span>
      <span style={{ fontSize: 14, fontFamily: "var(--font-mono)", fontWeight: 600, color: accent ? "var(--text-accent)" : "var(--text-primary)" }}>{value}</span>
    </div>
  );
}
