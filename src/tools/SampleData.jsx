// Pocket — Sample Data generator. Define a schema of typed fields and generate
// rows as CSV or JSON. Companion to the CSV tools. Fully client-side (Math.random
// + crypto.randomUUID). DS + tokens.
import React from "react";
import { Panel } from "../../Pocket Design System/components/surfaces/Panel.jsx";
import { Input } from "../../Pocket Design System/components/forms/Input.jsx";
import { Badge } from "../../Pocket Design System/components/core/Badge.jsx";
import { Button } from "../../Pocket Design System/components/core/Button.jsx";
import { Select } from "../../Pocket Design System/components/forms/Select.jsx";
import { Textarea } from "../../Pocket Design System/components/forms/Textarea.jsx";
import { SegmentedControl } from "../../Pocket Design System/components/forms/SegmentedControl.jsx";
import { CopyButton } from "../../Pocket Design System/components/core/CopyButton.jsx";
import { IconButton } from "../../Pocket Design System/components/core/IconButton.jsx";
import { csvField } from "./csv-shared.js";
import { downloadText } from "./file-shared.jsx";

const FIRST = ["Ada", "Grace", "Alan", "Linus", "Margaret", "Edsger", "Ken", "Barbara", "Tim", "Radia", "Guido", "Dennis", "Donald", "Katherine", "John", "Sofia", "Leo", "Mira", "Noah", "Iris"];
const LAST = ["Lovelace", "Hopper", "Turing", "Torvalds", "Hamilton", "Dijkstra", "Thompson", "Liskov", "Berners-Lee", "Perlman", "Ritchie", "Knuth", "Johnson", "Carmack", "Nguyen", "Okafor", "Silva", "Haddad", "Kovač", "Rossi"];
const CITIES = ["Lisbon", "Kyoto", "Austin", "Oslo", "Nairobi", "Medellín", "Tallinn", "Hanoi", "Porto", "Denver", "Accra", "Riga", "Lima", "Galway", "Bergen"];
const COUNTRIES = ["Portugal", "Japan", "USA", "Norway", "Kenya", "Colombia", "Estonia", "Vietnam", "Ghana", "Latvia", "Peru", "Ireland", "Brazil", "Croatia"];
const WORDS = ["amber", "ink", "paper", "fast", "quiet", "local", "warm", "signal", "pocket", "draft", "ember", "linen", "north", "slate", "cedar", "harbor"];
const DOMAINS = ["example.com", "mail.dev", "pocket.tools", "inbox.io", "test.org"];

const TYPES = [
  "id", "uuid", "firstName", "lastName", "fullName", "email", "username",
  "int", "float", "bool", "date", "datetime", "city", "country", "word", "sentence", "phone", "color",
];

const rnd = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rnd(arr.length)];
const pad2 = (n) => String(n).padStart(2, "0");

function genValue(type, i) {
  switch (type) {
    case "id": return i + 1;
    case "uuid": return crypto.randomUUID();
    case "firstName": return pick(FIRST);
    case "lastName": return pick(LAST);
    case "fullName": return pick(FIRST) + " " + pick(LAST);
    case "email": return (pick(FIRST) + "." + pick(LAST)).toLowerCase().replace(/[^a-z.]/g, "") + "@" + pick(DOMAINS);
    case "username": return pick(WORDS) + "_" + pick(WORDS) + rnd(100);
    case "int": return rnd(1000);
    case "float": return Math.round(Math.random() * 100000) / 100;
    case "bool": return Math.random() < 0.5;
    case "date": { const d = new Date(Date.now() + (rnd(730) - 365) * 86400000); return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
    case "datetime": return new Date(Date.now() + (rnd(730) - 365) * 86400000).toISOString();
    case "city": return pick(CITIES);
    case "country": return pick(COUNTRIES);
    case "word": return pick(WORDS);
    case "sentence": return Array.from({ length: 4 + rnd(5) }, () => pick(WORDS)).join(" ");
    case "phone": return `+1-${200 + rnd(700)}-${pad2(rnd(100))}${pad2(rnd(100))}-${pad2(rnd(100))}${pad2(rnd(100))}`.slice(0, 16);
    case "color": return "#" + rnd(0x1000000).toString(16).padStart(6, "0");
    default: return "";
  }
}

const DEFAULT_FIELDS = [
  { name: "id", type: "id" }, { name: "name", type: "fullName" },
  { name: "email", type: "email" }, { name: "age", type: "int" }, { name: "active", type: "bool" },
];

export default function SampleDataScreen() {
  const [fields, setFields] = React.useState(DEFAULT_FIELDS);
  const [count, setCount] = React.useState(25);
  const [format, setFormat] = React.useState("csv");
  const [seed, setSeed] = React.useState(0);

  const n = Math.min(5000, Math.max(1, Number(count) || 1));
  const cols = fields.filter((f) => f.name.trim());

  const output = React.useMemo(() => {
    if (!cols.length) return "";
    if (format === "json") {
      const rows = [];
      for (let i = 0; i < n; i++) {
        const o = {};
        for (const f of cols) o[f.name] = genValue(f.type, i);
        rows.push(o);
      }
      return JSON.stringify(rows, null, 2);
    }
    // CSV
    let out = cols.map((f) => csvField(f.name, ",")).join(",") + "\n";
    for (let i = 0; i < n; i++) {
      const cells = cols.map((f) => csvField(genValue(f.type, i), ","));
      out += cells.join(",") + (i < n - 1 ? "\n" : "");
    }
    return out;
  }, [cols, n, format, seed]); // eslint-disable-line

  const setField = (i, patch) => setFields((fs) => fs.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  const addField = () => setFields((fs) => [...fs, { name: "field_" + (fs.length + 1), type: "word" }]);
  const delField = (i) => setFields((fs) => fs.filter((_, idx) => idx !== i));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Input mono type="number" min={1} max={5000} value={count} onChange={(e) => setCount(e.target.value)} style={{ width: 90 }} />
        <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>rows</span>
        <SegmentedControl options={[{ value: "csv", label: "CSV" }, { value: "json", label: "JSON" }]} value={format} onChange={setFormat} />
        <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Button variant="secondary" size="sm" icon="refresh-cw" onClick={() => setSeed((s) => s + 1)}>Regenerate</Button>
          <Button variant="primary" size="sm" icon="download" disabled={!output}
            onClick={() => downloadText(output, "sample." + format, format === "json" ? "application/json" : "text/csv")}>Download</Button>
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 14, flex: 1, minHeight: 0 }}>
        <Panel variant="sunken" title="Fields" meta={`${cols.length}`} style={{ minHeight: 0 }}>
          <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {fields.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <Input mono value={f.name} onChange={(e) => setField(i, { name: e.target.value })} placeholder="name" style={{ flex: 1, minWidth: 0 }} />
                <Select options={TYPES} value={f.type} onChange={(e) => setField(i, { type: e.target.value })} style={{ minWidth: 0 }} />
                <IconButton icon="trash-2" label="Remove field" size="sm" onClick={() => delField(i)} />
              </div>
            ))}
            <Button variant="secondary" size="sm" icon="plus" onClick={addField}>Add field</Button>
          </div>
        </Panel>

        <Panel variant="code" title="Output" meta={<Badge kind="accent">{n} rows</Badge>}
          actions={output ? <CopyButton onDark getText={() => output} /> : null} style={{ minHeight: 0 }}>
          <Textarea bare readOnly value={output} style={{ flex: 1, padding: "12px 16px", minHeight: 0, color: "var(--code-fg)" }} />
        </Panel>
      </div>
    </div>
  );
}
