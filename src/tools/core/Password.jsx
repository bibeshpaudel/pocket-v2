import React from "react";
import { Panel } from "../../../Pocket Design System/components/surfaces/Panel.jsx";
import { Badge } from "../../../Pocket Design System/components/core/Badge.jsx";
import { CopyButton } from "../../../Pocket Design System/components/core/CopyButton.jsx";
import { IconButton } from "../../../Pocket Design System/components/core/IconButton.jsx";
import { Switch } from "../../../Pocket Design System/components/forms/Switch.jsx";

const PW_CHARS = {
  lower: "abcdefghijkmnopqrstuvwxyz",
  upper: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  numbers: "23456789",
  symbols: "!@#$%^&*-_=+?",
};

function makePassword(len, opts) {
  let pool = PW_CHARS.lower;
  if (opts.upper) pool += PW_CHARS.upper;
  if (opts.numbers) pool += PW_CHARS.numbers;
  if (opts.symbols) pool += PW_CHARS.symbols;
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => pool[n % pool.length]).join("");
}

export default function PasswordScreen() {
  const [len, setLen] = React.useState(20);
  const [opts, setOpts] = React.useState({ upper: true, numbers: true, symbols: true });
  const [nonce, setNonce] = React.useState(0);
  const pw = React.useMemo(() => makePassword(len, opts), [len, opts, nonce]);
  const strength = len >= 16 && opts.symbols ? ["ok", "Strong"] : len >= 12 ? ["warn", "Okay"] : ["danger", "Weak"];
  const setOpt = (k) => (v) => setOpts((o) => ({ ...o, [k]: v }));

  return (
    <div style={{ maxWidth: 560, margin: "32px auto 0", display: "flex", flexDirection: "column", gap: 16 }}>
      <Panel variant="code" title="Password" meta={<Badge kind={strength[0]} dot>{strength[1]}</Badge>}
        actions={
          <span style={{ display: "flex", gap: 6 }}>
            <IconButton icon="refresh-cw" label="Regenerate" size="sm" onClick={() => setNonce(nonce + 1)} style={{ color: "var(--syn-punct)" }} />
            <CopyButton onDark getText={() => pw} />
          </span>
        }>
        <div style={{ padding: "20px 18px", fontFamily: "var(--font-mono)", fontSize: 19, letterSpacing: "0.02em", color: "var(--code-fg)", wordBreak: "break-all", lineHeight: 1.5 }}>{pw}</div>
      </Panel>
      <div style={{ background: "var(--surface-raised)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 500, width: 90 }}>Length</span>
          <input type="range" min="8" max="64" value={len} onChange={(e) => setLen(Number(e.target.value))}
            style={{ flex: 1, accentColor: "var(--amber-500)" }} />
          <code style={{ fontSize: 13, width: 28, textAlign: "right", color: "var(--text-secondary)" }}>{len}</code>
        </div>
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
          <Switch checked={opts.upper} onChange={setOpt("upper")} label="Uppercase" />
          <Switch checked={opts.numbers} onChange={setOpt("numbers")} label="Numbers" />
          <Switch checked={opts.symbols} onChange={setOpt("symbols")} label="Symbols" />
        </div>
        <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Generated locally with <code>crypto.getRandomValues</code>. Ambiguous characters (Il1 O0) are excluded.</div>
      </div>
    </div>
  );
}
