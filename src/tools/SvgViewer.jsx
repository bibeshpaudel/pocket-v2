// Pocket — SVG Viewer. Paste or drop SVG markup to preview it, read its
// dimensions, and emit a cleaned/minified version. 100% client-side. Preview is
// rendered via a data-URL <img> (no embedded script executes). DS + tokens.
import React from "react";
import { Panel } from "../../Pocket Design System/components/surfaces/Panel.jsx";
import { Textarea } from "../../Pocket Design System/components/forms/Textarea.jsx";
import { Badge } from "../../Pocket Design System/components/core/Badge.jsx";
import { Button } from "../../Pocket Design System/components/core/Button.jsx";
import { IconButton } from "../../Pocket Design System/components/core/IconButton.jsx";
import { CopyButton } from "../../Pocket Design System/components/core/CopyButton.jsx";
import { Switch } from "../../Pocket Design System/components/forms/Switch.jsx";
import { Stat, CHECKER, formatBytes, readAsText, downloadText } from "./image-shared.jsx";

const SAMPLE = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <!-- a friendly pocket mark -->
  <rect x="14" y="14" width="92" height="92" rx="20" fill="#f59e0b"/>
  <path d="M40 64 L56 80 L84 44" stroke="#1a1208" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

function cleanSvg(svg) {
  return svg
    .replace(/<\?xml[\s\S]*?\?>/g, "")
    .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<metadata[\s\S]*?<\/metadata>/gi, "")
    .replace(/\s(sodipodi|inkscape):[a-z-]+="[^"]*"/gi, "")
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function analyze(svg) {
  if (!svg.trim()) return { empty: true };
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  if (doc.querySelector("parsererror")) return { error: "Not well-formed SVG/XML." };
  const el = doc.querySelector("svg");
  if (!el) return { error: "No <svg> root element found." };
  const vb = el.getAttribute("viewBox");
  let w = el.getAttribute("width"), h = el.getAttribute("height");
  if ((!w || !h) && vb) { const p = vb.split(/[\s,]+/); w = w || p[2]; h = h || p[3]; }
  const count = doc.querySelectorAll("*").length - 1; // minus the root
  return { width: w || "—", height: h || "—", viewBox: vb || "—", nodes: count };
}

export default function SvgViewerScreen() {
  const [text, setText] = React.useState(SAMPLE);
  const [minify, setMinify] = React.useState(true);

  const info = React.useMemo(() => analyze(text), [text]);
  const cleaned = React.useMemo(() => (minify ? cleanSvg(text) : text.trim()), [text, minify]);
  const valid = !info.empty && !info.error;
  const dataUri = valid ? "data:image/svg+xml;utf8," + encodeURIComponent(cleaned || text) : null;
  const savedPct = text.length ? Math.max(0, Math.round((1 - cleaned.length / text.length) * 100)) : 0;

  const openFile = async (file) => { try { setText(await readAsText(file)); } catch (e) { /* ignore */ } };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <Switch checked={minify} onChange={setMinify} label="Minify (strip comments, metadata, whitespace)" />
        <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <label>
            <input type="file" accept=".svg,image/svg+xml" onChange={(e) => { if (e.target.files[0]) openFile(e.target.files[0]); e.target.value = ""; }} style={{ display: "none" }} />
            <Button variant="secondary" size="sm" icon="upload" onClick={(e) => e.currentTarget.previousSibling.click()}>Open .svg</Button>
          </label>
          <Button variant="ghost" size="sm" icon="rotate-ccw" onClick={() => setText(SAMPLE)}>Sample</Button>
        </span>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) openFile(f); }}
        style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Panel title="SVG source" variant="sunken" meta={formatBytes(text.length)}
          actions={<IconButton icon="x" label="Clear" size="sm" onClick={() => setText("")} />}>
          <Textarea bare value={text} onChange={(e) => setText(e.target.value)}
            placeholder="Paste SVG markup, or drop a .svg file…" style={{ flex: 1, padding: "12px 14px", minHeight: 0 }} />
        </Panel>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
          <Panel title="Preview" variant="sunken"
            meta={info.error ? <Badge kind="danger">Invalid</Badge> : valid ? <Badge kind="ok" dot>{info.width} × {info.height}</Badge> : null}
            style={{ flex: 1, minHeight: 0 }}>
            <div style={{ flex: 1, minHeight: 0, display: "grid", placeItems: "center", padding: 16, ...CHECKER }}>
              {info.error ? <span style={{ fontSize: 13, color: "var(--danger)" }}>{info.error}</span>
                : info.empty ? <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Paste SVG to preview</span>
                : <img src={dataUri} alt="svg preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />}
            </div>
          </Panel>

          <Panel title={minify ? "Cleaned SVG" : "Output SVG"} variant="code"
            meta={valid ? <Badge kind="ok" dot>{savedPct ? "−" + savedPct + "%" : formatBytes(cleaned.length)}</Badge> : null}
            actions={valid ? (
              <span style={{ display: "flex", gap: 6 }}>
                <CopyButton onDark getText={() => cleaned} label="Copy" />
                <CopyButton onDark getText={() => dataUri} label="Data URI" />
                <IconButton icon="download" label="Download" size="sm" onClick={() => downloadText(cleaned, "image.svg", "image/svg+xml")} style={{ color: "var(--syn-punct)" }} />
              </span>
            ) : null}
            style={{ flex: "none", height: "38%" }}>
            <pre style={{ margin: 0, padding: "12px 16px", overflow: "auto", flex: 1, minHeight: 0, fontFamily: "var(--font-mono)", fontSize: 12.5, lineHeight: 1.6, color: "var(--code-fg)", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{valid ? cleaned : ""}</pre>
          </Panel>
        </div>
      </div>

      {valid ? (
        <div style={{ flex: "none", display: "flex", gap: 28, flexWrap: "wrap", padding: "12px 16px", background: "var(--surface-raised)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)" }}>
          <Stat label="Width" value={String(info.width)} />
          <Stat label="Height" value={String(info.height)} />
          <Stat label="viewBox" value={String(info.viewBox)} />
          <Stat label="Elements" value={String(info.nodes)} />
          <Stat label="Raw → clean" value={formatBytes(text.length) + " → " + formatBytes(cleaned.length)} accent />
        </div>
      ) : null}
    </div>
  );
}
