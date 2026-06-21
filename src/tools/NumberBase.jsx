// Pocket — Number Base Converter. Bin / oct / dec / hex + any base 2–36, backed
// by BigInt so arbitrarily large values convert without overflow. Pure client-side.
import React from "react";
import { Panel } from "../../Pocket Design System/components/surfaces/Panel.jsx";
import { Input } from "../../Pocket Design System/components/forms/Input.jsx";
import { Badge } from "../../Pocket Design System/components/core/Badge.jsx";
import { SegmentedControl } from "../../Pocket Design System/components/forms/SegmentedControl.jsx";
import { CopyButton } from "../../Pocket Design System/components/core/CopyButton.jsx";
import { parseBigIntInBase, bigIntToBase } from "./text-convert.js";

const COMMON = [{ value: "2", label: "Bin" }, { value: "8", label: "Oct" }, { value: "10", label: "Dec" }, { value: "16", label: "Hex" }];
const OUTPUTS = [["Binary", 2], ["Octal", 8], ["Decimal", 10], ["Hexadecimal", 16]];

export default function NumberBaseScreen() {
  const [value, setValue] = React.useState("255");
  const [fromBase, setFromBase] = React.useState("10");
  const [customBase, setCustomBase] = React.useState("36");

  let parsed = null, error = null;
  const fb = Number(fromBase);
  try { if (value.trim()) parsed = parseBigIntInBase(value, fb); }
  catch (e) { error = e.message; }

  const out = (base) => {
    if (parsed == null) return "";
    try { return bigIntToBase(parsed, base); } catch (e) { return ""; }
  };
  const cb = Math.min(36, Math.max(2, Number(customBase) || 2));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>From base</span>
        <SegmentedControl options={COMMON} value={fromBase} onChange={setFromBase} mono />
        <Input mono type="number" min={2} max={36} value={fromBase} onChange={(e) => setFromBase(e.target.value)} style={{ width: 80 }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, flex: 1, minHeight: 0 }}>
        <Panel variant="sunken" title="Input" meta={`base ${fb}`} style={{ minHeight: 0 }}>
          <div style={{ flex: 1, minHeight: 0, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <Input mono value={value} onChange={(e) => setValue(e.target.value)} placeholder="Enter a number…"
              error={error || undefined} style={{ width: "100%" }} />
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", lineHeight: 1.6 }}>
              Accepts <code>0x</code>/<code>0b</code>/<code>0o</code> prefixes and <code>_</code> separators.
              Digits use 0–9 then a–z for bases above 10. Backed by BigInt — no size limit.
            </div>
          </div>
        </Panel>

        <Panel variant="raised" title="Conversions"
          meta={value.trim() ? <Badge kind={error ? "danger" : "ok"} dot>{error ? "Invalid" : "OK"}</Badge> : null}
          style={{ minHeight: 0 }}>
          <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {OUTPUTS.map(([label, base]) => (
              <div key={base} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" }}>
                <span style={{ width: 92, fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>{label}</span>
                <span style={{ flex: 1, fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-primary)", wordBreak: "break-all" }}>{out(base) || "—"}</span>
                {out(base) ? <CopyButton text={out(base)} /> : null}
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" }}>
              <span style={{ width: 92, display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--text-tertiary)" }}>
                Base
                <Input mono type="number" min={2} max={36} value={customBase} onChange={(e) => setCustomBase(e.target.value)} style={{ width: 52 }} />
              </span>
              <span style={{ flex: 1, fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-primary)", wordBreak: "break-all" }}>{out(cb) || "—"}</span>
              {out(cb) ? <CopyButton text={out(cb)} /> : null}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
