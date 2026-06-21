// Pocket app — tool screens: JSON Formatter, Password Generator, generic stub
const {
  Panel, Textarea, Badge, CopyButton, IconButton, Button, Select, Switch,
  SegmentedControl, EmptyState, Icon,
} = window.PocketDesignSystem_654e67;

const SAMPLE_JSON = '{"name":"pocket","tools":35,"client_side":true,"categories":["formatters","generators","converters"],"latency_ms":0.4}';

function JsonFormatterScreen() {
  const [input, setInput] = React.useState(SAMPLE_JSON);
  const [mode, setMode] = React.useState("Pretty");
  const [indent, setIndent] = React.useState("2");
  const [sortKeys, setSortKeys] = React.useState(false);

  let output = "";
  let error = null;
  if (input.trim()) {
    try {
      let parsed = JSON.parse(input);
      if (sortKeys) parsed = sortDeep(parsed);
      output = mode === "Minify"
        ? JSON.stringify(parsed)
        : JSON.stringify(parsed, null, indent === "tab" ? "\t" : Number(indent));
    } catch (e) {
      error = String(e.message || e);
    }
  }

  function sortDeep(v) {
    if (Array.isArray(v)) return v.map(sortDeep);
    if (v && typeof v === "object") {
      const out = {};
      Object.keys(v).sort().forEach((k) => { out[k] = sortDeep(v[k]); });
      return out;
    }
    return v;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <SegmentedControl options={["Pretty", "Minify"]} value={mode} onChange={setMode} />
        <Select options={[{ value: "2", label: "2 spaces" }, { value: "4", label: "4 spaces" }, { value: "tab", label: "Tabs" }]}
          value={indent} onChange={(e) => setIndent(e.target.value)} disabled={mode === "Minify"} />
        <Switch checked={sortKeys} onChange={setSortKeys} label="Sort keys" />
        <span style={{ marginLeft: "auto" }}>
          <Button variant="ghost" size="sm" icon="rotate-ccw" onClick={() => setInput(SAMPLE_JSON)}>Sample</Button>
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Panel title="Input" variant="sunken" meta={input.length.toLocaleString() + " chars"}
          actions={<IconButton icon="x" label="Clear" size="sm" onClick={() => setInput("")} />}>
          <Textarea bare value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Paste JSON here…" style={{ flex: 1, padding: "12px 14px", minHeight: 0 }} />
        </Panel>
        <Panel title="Output" variant="code"
          meta={error ? <Badge kind="danger">Parse error</Badge> : input.trim() ? <Badge kind="ok" dot>Valid JSON</Badge> : null}
          actions={<CopyButton onDark getText={() => output} />}>
          {error ? (
            <div style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.6, color: "#E08A76" }}>{error}</div>
          ) : (
            <pre style={{ margin: 0, padding: "12px 16px", overflow: "auto", flex: 1, fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.6, color: "var(--code-fg)" }}
              dangerouslySetInnerHTML={{ __html: window.pocketHighlightJSON(output) }} />
          )}
        </Panel>
      </div>
    </div>
  );
}

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

function PasswordScreen() {
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

function StubScreen({ tool }) {
  return (
    <div style={{ display: "grid", placeItems: "center", height: "100%" }}>
      <EmptyState icon={tool.icon} title={tool.name + " isn't built in this UI kit"}
        hint="It would follow the same layout: options on top, input and output side by side." />
    </div>
  );
}

Object.assign(window, { JsonFormatterScreen, PasswordScreen, StubScreen });
