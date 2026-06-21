// Pocket — Color Converter. Parse any CSS color (hex / rgb / hsl / named) and
// see it in every format with a live swatch. Uses a 1×1 canvas to normalise CSS
// colors, then computes HSL/HSV locally. Fully client-side. DS + tokens.
import React from "react";
import { Panel } from "../../Pocket Design System/components/surfaces/Panel.jsx";
import { Input } from "../../Pocket Design System/components/forms/Input.jsx";
import { Badge } from "../../Pocket Design System/components/core/Badge.jsx";
import { CopyButton } from "../../Pocket Design System/components/core/CopyButton.jsx";

let _ctx = null;
function ctx() {
  if (!_ctx) { const c = document.createElement("canvas"); c.width = c.height = 1; _ctx = c.getContext("2d", { willReadFrequently: true }); }
  return _ctx;
}
function parseColor(str) {
  const c = ctx();
  // Validity probe: a real color resolves the same regardless of prior fill.
  c.fillStyle = "#000"; c.fillStyle = str; const a = c.fillStyle;
  c.fillStyle = "#fff"; c.fillStyle = str; const b = c.fillStyle;
  if (a !== b) return null;
  c.clearRect(0, 0, 1, 1); c.fillStyle = str; c.fillRect(0, 0, 1, 1);
  const d = c.getImageData(0, 0, 1, 1).data;
  return { r: d[0], g: d[1], b: d[2], a: Math.round((d[3] / 255) * 100) / 100 };
}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  const d = max - min;
  if (d) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}
function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0; const s = max === 0 ? 0 : d / max; const v = max;
  if (d) {
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), v: Math.round(v * 100) };
}
const hex2 = (n) => n.toString(16).padStart(2, "0");

const SLIDERS = [["r", 255], ["g", 255], ["b", 255]];

export default function ColorConverterScreen() {
  const [text, setText] = React.useState("#e8a13a");
  const [rgba, setRgba] = React.useState({ r: 232, g: 161, b: 58, a: 1 });
  const [valid, setValid] = React.useState(true);

  // Parse typed text → canonical rgba.
  const onText = (v) => {
    setText(v);
    const parsed = parseColor(v.trim());
    if (parsed) { setRgba(parsed); setValid(true); } else setValid(false);
  };
  const setChannel = (k, v) => {
    const next = { ...rgba, [k]: k === "a" ? v : Math.round(v) };
    setRgba(next); setValid(true);
    setText("#" + hex2(next.r) + hex2(next.g) + hex2(next.b));
  };

  const { r, g, b, a } = rgba;
  const hsl = rgbToHsl(r, g, b);
  const hsv = rgbToHsv(r, g, b);
  const hex = "#" + hex2(r) + hex2(g) + hex2(b);
  const hex8 = hex + hex2(Math.round(a * 255));
  const cssNow = a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : hex;

  const formats = [
    ["HEX", a < 1 ? hex8 : hex],
    ["RGB", `rgb(${r}, ${g}, ${b})`],
    ["RGBA", `rgba(${r}, ${g}, ${b}, ${a})`],
    ["HSL", `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`],
    ["HSLA", `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${a})`],
    ["HSV", `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`],
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, flex: 1, minHeight: 0 }}>
        <Panel variant="sunken" title="Color" style={{ minHeight: 0 }}>
          <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ height: 120, borderRadius: "var(--radius-lg)", border: "1px solid var(--border-default)", background: cssNow }} />
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="color" value={hex} onChange={(e) => onText(e.target.value)}
                style={{ width: 44, height: 38, padding: 0, border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", background: "var(--surface-raised)", cursor: "pointer" }} />
              <Input mono value={text} onChange={(e) => onText(e.target.value)} placeholder="#e8a13a, rgb(...), tomato…"
                error={valid ? undefined : "Not a recognized color"} style={{ flex: 1 }} />
            </div>
            {SLIDERS.map(([k, max]) => (
              <label key={k} style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-secondary)" }}>
                <span style={{ width: 16, textTransform: "uppercase" }}>{k}</span>
                <input type="range" min={0} max={max} value={rgba[k]} onChange={(e) => setChannel(k, Number(e.target.value))}
                  style={{ flex: 1, accentColor: "var(--accent)" }} />
                <span style={{ width: 30, textAlign: "right" }}>{rgba[k]}</span>
              </label>
            ))}
            <label style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-secondary)" }}>
              <span style={{ width: 16, textTransform: "uppercase" }}>A</span>
              <input type="range" min={0} max={1} step={0.01} value={a} onChange={(e) => setChannel("a", Number(e.target.value))}
                style={{ flex: 1, accentColor: "var(--accent)" }} />
              <span style={{ width: 30, textAlign: "right" }}>{a}</span>
            </label>
          </div>
        </Panel>

        <Panel variant="raised" title="Formats" meta={<Badge kind={valid ? "ok" : "danger"} dot>{valid ? "Valid" : "Invalid"}</Badge>} style={{ minHeight: 0 }}>
          <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {formats.map(([label, value]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" }}>
                <span style={{ width: 48, fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>{label}</span>
                <span style={{ flex: 1, fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</span>
                <CopyButton text={value} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
