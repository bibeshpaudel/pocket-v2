// Pocket — CSV to SQL. Generates INSERT statements (optionally CREATE TABLE) in
// MySQL / PostgreSQL / SQLite / SQL Server flavours. Conversion runs in the CSV
// Web Worker; output is preview-capped for the DOM. DS primitives + tokens only.
import React from "react";
import { Panel } from "../../Pocket Design System/components/surfaces/Panel.jsx";
import { Textarea } from "../../Pocket Design System/components/forms/Textarea.jsx";
import { Badge } from "../../Pocket Design System/components/core/Badge.jsx";
import { Button } from "../../Pocket Design System/components/core/Button.jsx";
import { Switch } from "../../Pocket Design System/components/forms/Switch.jsx";
import { Select } from "../../Pocket Design System/components/forms/Select.jsx";
import { Input } from "../../Pocket Design System/components/forms/Input.jsx";
import { CopyButton } from "../../Pocket Design System/components/core/CopyButton.jsx";
import { IconButton } from "../../Pocket Design System/components/core/IconButton.jsx";
import { runCsv } from "./csv-engine.js";
import { readText, downloadText, formatBytes } from "./file-shared.jsx";

const DELIMS = [
  { value: "auto", label: "Auto-detect" },
  { value: ",", label: "Comma ," },
  { value: ";", label: "Semicolon ;" },
  { value: "\t", label: "Tab" },
  { value: "|", label: "Pipe |" },
];
const DIALECTS = [
  { value: "mysql", label: "MySQL" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "sqlite", label: "SQLite" },
  { value: "sqlserver", label: "SQL Server" },
];
// Below this, a loaded file goes into the editable textarea; above it, the
// non-editable file card (keeps a huge string out of the DOM).
const INLINE_LIMIT = 1000000;

export default function CsvSqlScreen() {
  const [delimiter, setDelimiter] = React.useState("auto");
  const [hasHeader, setHasHeader] = React.useState(true);
  const [typed, setTyped] = React.useState(true);
  const [dialect, setDialect] = React.useState("mysql");
  const [table, setTable] = React.useState("my_table");
  const [createTable, setCreateTable] = React.useState(true);
  const [multiRow, setMultiRow] = React.useState(true);

  const [text, setText] = React.useState("");
  const fileTextRef = React.useRef("");
  const [file, setFile] = React.useState(null);

  const [out, setOut] = React.useState({ status: "idle" });
  const outputRef = React.useRef("");
  const reqId = React.useRef(0);

  const sourceText = file ? fileTextRef.current : text;

  const run = React.useCallback((src) => {
    const ticket = ++reqId.current;
    if (!src) { outputRef.current = ""; setOut({ status: "idle" }); return; }
    setOut({ status: "working", progress: 0 });
    runCsv("csvToSql", { text: src, delimiter, hasHeader, typed, dialect, table: table.trim() || "my_table", createTable, multiRow, batchSize: 500 },
      (p) => { if (ticket === reqId.current) setOut((s) => (s.status === "working" ? { ...s, progress: p } : s)); })
      .then((r) => {
        if (ticket !== reqId.current) return;
        outputRef.current = r.output;
        setOut({ status: "done", preview: r.preview, truncated: r.truncated, full: r.output.length, rowCount: r.rowCount });
      })
      .catch((e) => {
        if (ticket !== reqId.current || (e && e.message === "cancelled")) return;
        outputRef.current = "";
        setOut({ status: "error", message: (e && e.message) || "Conversion failed" });
      });
  }, [delimiter, hasHeader, typed, dialect, table, createTable, multiRow]);

  React.useEffect(() => {
    const t = setTimeout(() => run(sourceText), 200);
    return () => clearTimeout(t);
  }, [sourceText, run]);

  const loadFile = async (f) => {
    try {
      const t = await readText(f);
      // Small files load into the editable textarea; only large ones use the
      // non-editable card so a <textarea> never holds a huge string.
      if (t.length <= INLINE_LIMIT) { fileTextRef.current = ""; setFile(null); setText(t); }
      else { fileTextRef.current = t; setText(""); setFile({ name: f.name, size: f.size }); }
    } catch (e) { setOut({ status: "error", message: "Could not read file" }); }
  };
  const clearFile = () => { fileTextRef.current = ""; setFile(null); };
  const clearInput = () => { if (file) clearFile(); else setText(""); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Input mono value={table} onChange={(e) => setTable(e.target.value)} placeholder="table name" style={{ width: 150 }} />
        <Select options={DIALECTS} value={dialect} onChange={(e) => setDialect(e.target.value)} />
        <Select options={DELIMS} value={delimiter} onChange={(e) => setDelimiter(e.target.value)} />
        <Switch checked={hasHeader} onChange={setHasHeader} label="Header row" />
        <Switch checked={typed} onChange={setTyped} label="Infer types" />
        <Switch checked={createTable} onChange={setCreateTable} label="CREATE TABLE" />
        <Switch checked={multiRow} onChange={setMultiRow} label="Multi-row" />
        <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Button variant="secondary" size="sm" icon="file-up" onClick={() => document.getElementById("csvsql-file").click()}>Load file</Button>
          <input id="csvsql-file" type="file" accept=".csv,.tsv,.txt,text/csv" style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files[0]; if (f) loadFile(f); e.target.value = ""; }} />
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, flex: 1, minHeight: 0 }}>
        <Panel variant="sunken" title="Input · CSV"
          meta={file ? formatBytes(file.size) : (sourceText.length ? sourceText.length.toLocaleString() + " chars" : null)}
          actions={(sourceText || file) ? <IconButton icon="x" label="Clear" size="sm" onClick={clearInput} /> : null}
          style={{ minHeight: 0 }}>
          {file ? (
            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 16, textAlign: "center" }}>
              <Badge kind="accent">{file.name}</Badge>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{formatBytes(file.size)} loaded — large file kept off-screen for speed; converting directly from it.</div>
              <Button variant="secondary" size="sm" icon="x" onClick={clearFile}>Remove file</Button>
            </div>
          ) : (
            <Textarea bare value={text} onChange={(e) => setText(e.target.value)}
              placeholder={"id,name,active\n1,Ada,true\n2,Grace,false"}
              style={{ flex: 1, padding: "12px 16px", minHeight: 0 }} />
          )}
        </Panel>

        <Panel variant="code" title="Output · SQL"
          meta={out.status === "working" ? <span style={{ color: "var(--syn-comment)" }}>generating… {Math.round((out.progress || 0) * 100)}%</span>
            : out.status === "error" ? <Badge kind="danger">Error</Badge>
            : out.status === "done" ? <Badge kind="ok" dot>{(out.rowCount || 0).toLocaleString()} rows</Badge>
            : null}
          actions={out.status === "done" && outputRef.current ? (
            <span style={{ display: "flex", gap: 6 }}>
              <CopyButton onDark getText={() => outputRef.current} />
              <IconButton icon="download" label="Download" size="sm" onClick={() => downloadText(outputRef.current, (table.trim() || "data") + ".sql", "application/sql")} />
            </span>
          ) : null}
          style={{ minHeight: 0 }}>
          {out.status === "error" ? (
            <div style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: 13, color: "#E08A76" }}>{out.message}</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
              {out.status === "done" && out.truncated ? (
                <div style={{ padding: "6px 16px", fontSize: 12, color: "var(--syn-comment)", borderBottom: "1px solid var(--code-line)" }}>
                  Preview truncated to {Math.round(out.preview.length / 1000)}k of {Math.round(out.full / 1000).toLocaleString()}k chars — use Copy / Download for the full script.
                </div>
              ) : null}
              <Textarea bare readOnly value={out.status === "done" ? out.preview : ""}
                placeholder={out.status === "working" ? "Generating…" : ""}
                style={{ flex: 1, padding: "12px 16px", minHeight: 0, color: "var(--code-fg)" }} />
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
