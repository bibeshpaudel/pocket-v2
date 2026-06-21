// Pocket — Mermaid Editor. Live diagrams-from-text via the mermaid library.
// 100% client-side; rendered with securityLevel "strict" (labels sanitized).
// Export to SVG / PNG, copy source. DS primitives + tokens only.
import React from "react";
import mermaid from "mermaid";
import { Panel } from "../../Pocket Design System/components/surfaces/Panel.jsx";
import { Textarea } from "../../Pocket Design System/components/forms/Textarea.jsx";
import { Badge } from "../../Pocket Design System/components/core/Badge.jsx";
import { Button } from "../../Pocket Design System/components/core/Button.jsx";
import { IconButton } from "../../Pocket Design System/components/core/IconButton.jsx";
import { CopyButton } from "../../Pocket Design System/components/core/CopyButton.jsx";
import { Select } from "../../Pocket Design System/components/forms/Select.jsx";
import { useSplitView } from "../split-view.jsx";

const SAMPLES = {
  Flowchart: "flowchart TD\n  A[Start] --> B{Decision}\n  B -->|Yes| C[Do the thing]\n  B -->|No| D[Skip it]\n  C --> E[End]\n  D --> E",
  Sequence: "sequenceDiagram\n  participant U as User\n  participant P as Pocket\n  U->>P: Open the tool\n  P-->>U: Render diagram\n  U->>P: Edit source\n  P-->>U: Live update",
  Class: "classDiagram\n  class Tool {\n    +String id\n    +String name\n    +render()\n  }\n  Tool <|-- MermaidEditor\n  Tool <|-- JwtDebugger",
  State: "stateDiagram-v2\n  [*] --> Idle\n  Idle --> Editing: type\n  Editing --> Rendering: debounce\n  Rendering --> Idle: done\n  Rendering --> Error: parse fails\n  Error --> Editing: fix",
  ER: "erDiagram\n  USER ||--o{ FAVORITE : has\n  TOOL ||--o{ FAVORITE : in\n  USER {\n    string email\n  }\n  TOOL {\n    string id\n    string category\n  }",
  Gantt: "gantt\n  title Pocket roadmap\n  dateFormat YYYY-MM-DD\n  section Security\n  JWT      :done,   2026-06-01, 5d\n  Certs    :active, 2026-06-12, 6d\n  section Diagrams\n  Mermaid  :        2026-06-20, 3d",
  Pie: 'pie showData title Tools by category\n  "Security" : 5\n  "Images" : 4\n  "Text" : 6\n  "Web" : 3',
  Mindmap: "mindmap\n  root((Pocket))\n    Formatters\n    Security\n      JWT\n      Certs\n    Images\n      Analyzer",
  "Git graph": "gitGraph\n  commit\n  branch dev\n  commit\n  commit\n  checkout main\n  merge dev\n  commit",
};
const SAMPLE_KEYS = Object.keys(SAMPLES);
const THEMES = ["default", "neutral", "forest", "dark"];

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function svgToPng(svg, scale) {
  const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("Could not rasterize SVG")); i.src = url; });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round((img.naturalWidth || 800) * scale));
  canvas.height = Math.max(1, Math.round((img.naturalHeight || 600) * scale));
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((res) => canvas.toBlob(res, "image/png"));
}

export default function MermaidEditorScreen() {
  const initialTheme = (typeof document !== "undefined" && document.documentElement.getAttribute("data-mode") === "dark") ? "dark" : "neutral";
  const [code, setCode] = React.useState(SAMPLES.Flowchart);
  const [theme, setTheme] = React.useState(initialTheme);
  const [zoom, setZoom] = React.useState(1);
  const [render, setRender] = React.useState({ status: "idle", svg: "" });
  const idRef = React.useRef(0);

  React.useEffect(() => {
    if (!code.trim()) { setRender({ status: "empty", svg: "" }); return undefined; }
    let cancelled = false;
    const handler = setTimeout(async () => {
      try {
        mermaid.initialize({ startOnLoad: false, theme, securityLevel: "strict", fontFamily: "inherit" });
        idRef.current += 1;
        const { svg } = await mermaid.render("pkt-mermaid-" + idRef.current, code);
        if (!cancelled) setRender({ status: "ok", svg });
      } catch (e) {
        if (!cancelled) setRender((prev) => ({ status: "error", svg: prev.svg, error: cleanErr(e) }));
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(handler); };
  }, [code, theme]);

  const sv = useSplitView("Editor", "Diagram");
  const lines = code ? code.split("\n").length : 0;

  const exportSvg = () => { if (render.svg) download(new Blob([render.svg], { type: "image/svg+xml" }), "diagram.svg"); };
  const exportPng = async () => { if (!render.svg) return; const blob = await svgToPng(render.svg, 2); if (blob) download(blob, "diagram.png"); };

  const meta = render.status === "error" ? <Badge kind="danger">Parse error</Badge>
    : render.status === "ok" ? <Badge kind="ok" dot>Rendered</Badge>
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Select value="" onChange={(e) => { if (e.target.value) { setCode(SAMPLES[e.target.value]); e.target.value = ""; } }}
          options={[{ value: "", label: "Insert template…" }, ...SAMPLE_KEYS.map((k) => ({ value: k, label: k }))]} />
        <Select value={theme} onChange={(e) => setTheme(e.target.value)} options={THEMES.map((t) => ({ value: t, label: "Theme: " + t }))} />
        {sv.control}
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <IconButton icon="zoom-out" label="Zoom out" size="sm" onClick={() => setZoom((z) => Math.max(0.25, +(z - 0.25).toFixed(2)))} />
          <code style={{ fontSize: 12, width: 40, textAlign: "center", color: "var(--text-secondary)" }}>{Math.round(zoom * 100)}%</code>
          <IconButton icon="zoom-in" label="Zoom in" size="sm" onClick={() => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)))} />
          <IconButton icon="maximize" label="Reset zoom" size="sm" onClick={() => setZoom(1)} />
          <Button variant="secondary" size="sm" icon="download" disabled={!render.svg} onClick={exportSvg}>SVG</Button>
          <Button variant="secondary" size="sm" icon="image" disabled={!render.svg} onClick={exportPng}>PNG</Button>
        </span>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: sv.columns, gap: 14 }}>
        <Panel style={sv.leftStyle} title="Editor" variant="sunken" meta={lines + (lines === 1 ? " line" : " lines")}
          actions={<IconButton icon="x" label="Clear" size="sm" onClick={() => setCode("")} />}>
          <Textarea bare mono value={code} onChange={(e) => setCode(e.target.value)}
            placeholder="Type mermaid syntax — flowchart, sequenceDiagram, classDiagram, gantt…"
            style={{ flex: 1, padding: "12px 14px", minHeight: 0 }} />
        </Panel>

        <Panel style={sv.rightStyle} title="Diagram" variant="sunken" meta={meta}
          actions={render.svg ? <CopyButton getText={() => render.svg} label="Copy SVG" /> : null}>
          {render.status === "empty" ? (
            <div style={{ flex: 1, display: "grid", placeItems: "center", color: "var(--text-tertiary)", fontSize: 13 }}>Type some mermaid to see it rendered.</div>
          ) : (
            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              <div style={{ flex: 1, minHeight: 0, overflow: "auto", display: "grid", placeItems: "center", padding: 16, background: theme === "dark" ? "#1e1e2e" : "#ffffff", borderRadius: "var(--radius-md)" }}>

                {render.svg ? (
                  <div style={{ transform: `scale(${zoom})`, transformOrigin: "center top", transition: "transform var(--duration-fast) var(--ease-out)" }}
                    dangerouslySetInnerHTML={{ __html: render.svg }} />
                ) : (
                  <span style={{ color: "var(--text-tertiary)", fontSize: 13 }}>—</span>
                )}
              </div>
              {render.status === "error" ? (
                <div style={{ flex: "none", borderTop: "1px solid var(--border-subtle)", padding: "10px 14px", background: "var(--surface-app)", fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.5, color: "var(--danger)", maxHeight: "32%", overflow: "auto", whiteSpace: "pre-wrap" }}>
                  {render.error}
                </div>
              ) : null}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function cleanErr(e) {
  const msg = String((e && e.message) || e || "Unknown error");
  return msg.replace(/^Error:\s*/, "").trim();
}
