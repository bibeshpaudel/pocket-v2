// Pocket — ULID / NanoID generator. Bulk, sortable ULIDs (Crockford base32) and
// URL-safe NanoIDs, using the Web Crypto RNG. Fully client-side. DS + tokens.
import React from "react";
import { Panel } from "../../Pocket Design System/components/surfaces/Panel.jsx";
import { Input } from "../../Pocket Design System/components/forms/Input.jsx";
import { Badge } from "../../Pocket Design System/components/core/Badge.jsx";
import { Button } from "../../Pocket Design System/components/core/Button.jsx";
import { Select } from "../../Pocket Design System/components/forms/Select.jsx";
import { Textarea } from "../../Pocket Design System/components/forms/Textarea.jsx";
import { SegmentedControl } from "../../Pocket Design System/components/forms/SegmentedControl.jsx";
import { CopyButton } from "../../Pocket Design System/components/core/CopyButton.jsx";

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // 32 chars → no modulo bias (256 % 32 === 0)
const ALPHABETS = {
  urlsafe: { label: "URL-safe (A–Za–z0–9_-)", chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-" },
  alnum: { label: "Alphanumeric", chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789" },
  lower: { label: "Lowercase + digits", chars: "abcdefghijklmnopqrstuvwxyz0123456789" },
  hex: { label: "Hex (lowercase)", chars: "0123456789abcdef" },
  numbers: { label: "Numbers", chars: "0123456789" },
};

function encodeTime(ms) {
  let str = "";
  for (let i = 9; i >= 0; i--) { str = CROCKFORD[ms % 32] + str; ms = Math.floor(ms / 32); }
  return str;
}
function ulid(time) {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let rand = "";
  for (let i = 0; i < 16; i++) rand += CROCKFORD[bytes[i] % 32];
  return encodeTime(time) + rand;
}
function nanoid(size, alphabet) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  const len = alphabet.length;
  let id = "";
  for (let i = 0; i < size; i++) id += alphabet[bytes[i] % len];
  return id;
}

export default function UlidNanoidScreen() {
  const [type, setType] = React.useState("ulid");
  const [count, setCount] = React.useState(10);
  const [size, setSize] = React.useState(21);
  const [alphabet, setAlphabet] = React.useState("urlsafe");
  const [seed, setSeed] = React.useState(0); // bump to regenerate

  const n = Math.min(2000, Math.max(1, Number(count) || 1));
  const sz = Math.min(256, Math.max(2, Number(size) || 21));
  const list = React.useMemo(() => {
    const chars = ALPHABETS[alphabet].chars;
    const now = Date.now();
    const out = [];
    for (let i = 0; i < n; i++) out.push(type === "ulid" ? ulid(now) : nanoid(sz, chars));
    return out;
  }, [type, n, sz, alphabet, seed]);

  const text = list.join("\n");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <SegmentedControl options={[{ value: "ulid", label: "ULID" }, { value: "nanoid", label: "NanoID" }]} value={type} onChange={setType} />
        <Input mono type="number" min={1} max={2000} value={count} onChange={(e) => setCount(e.target.value)} style={{ width: 90 }} />
        <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>count</span>
        {type === "nanoid" ? (
          <>
            <Input mono type="number" min={2} max={256} value={size} onChange={(e) => setSize(e.target.value)} style={{ width: 80 }} />
            <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>length</span>
            <Select options={Object.entries(ALPHABETS).map(([value, a]) => ({ value, label: a.label }))} value={alphabet} onChange={(e) => setAlphabet(e.target.value)} />
          </>
        ) : null}
        <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Button variant="secondary" size="sm" icon="refresh-cw" onClick={() => setSeed((s) => s + 1)}>Regenerate</Button>
        </span>
      </div>

      <Panel variant="code" title={type === "ulid" ? "ULIDs" : "NanoIDs"}
        meta={<Badge kind="accent">{n}</Badge>}
        actions={<CopyButton onDark getText={() => text} />}
        style={{ flex: 1, minHeight: 0 }}>
        <Textarea bare readOnly value={text} style={{ flex: 1, padding: "12px 16px", minHeight: 0, color: "var(--code-fg)" }} />
      </Panel>

      <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
        {type === "ulid"
          ? "ULIDs embed a millisecond timestamp, so they sort lexicographically by creation time."
          : "NanoIDs use the Web Crypto RNG. URL-safe alphabet at length 21 ≈ a UUID's collision resistance."}
      </div>
    </div>
  );
}
