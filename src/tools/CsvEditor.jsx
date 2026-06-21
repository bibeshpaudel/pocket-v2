// Pocket — CSV Editor. Drop or paste a CSV, edit cells / add / delete rows &
// columns in a virtualised grid (only the visible window is in the DOM), then
// copy or download. Parsing runs in the CSV Web Worker and the grid is capped at
// EDITOR_ROW_CAP rows so even multi-million-row files never freeze. DS + tokens.
import React from "react";
import { Panel } from "../../Pocket Design System/components/surfaces/Panel.jsx";
import { Badge } from "../../Pocket Design System/components/core/Badge.jsx";
import { Button } from "../../Pocket Design System/components/core/Button.jsx";
import { Switch } from "../../Pocket Design System/components/forms/Switch.jsx";
import { Select } from "../../Pocket Design System/components/forms/Select.jsx";
import { IconButton } from "../../Pocket Design System/components/core/IconButton.jsx";
import { Icon } from "../../Pocket Design System/components/core/Icon.jsx";
import { runCsv } from "./csv-engine.js";
import { EDITOR_ROW_CAP } from "./csv-shared.js";
import { Dropzone, readText, downloadText } from "./file-shared.jsx";

const DELIMS = [
  { value: "auto", label: "Auto-detect" },
  { value: ",", label: "Comma ," },
  { value: ";", label: "Semicolon ;" },
  { value: "\t", label: "Tab" },
  { value: "|", label: "Pipe |" },
];
const ROW_H = 34;
const COL_W = 168;
const GUTTER = 60;
const OVERSCAN = 8;

const cellInputStyle = {
  width: "100%", height: "100%", boxSizing: "border-box", border: "none", outline: "none",
  background: "transparent", padding: "0 8px", fontFamily: "var(--font-mono)",
  fontSize: "var(--text-sm)", lineHeight: 1.4, color: "var(--text-primary)",
};

export default function CsvEditorScreen() {
  const [status, setStatus] = React.useState("empty"); // empty | parsing | ready | error
  const [delimiter, setDelimiter] = React.useState("auto");
  const [hasHeader, setHasHeader] = React.useState(true);
  const [meta, setMeta] = React.useState({ name: "", total: 0, capped: false });
  const [errMsg, setErrMsg] = React.useState("");

  const originalText = React.useRef("");      // raw file/paste body, for re-parse
  const data = React.useRef({ headers: [], rows: [] });
  const [, force] = React.useReducer((n) => n + 1, 0);

  const bodyRef = React.useRef(null);
  const headRef = React.useRef(null);
  const [scrollTop, setScrollTop] = React.useState(0);
  const [viewportH, setViewportH] = React.useState(480);
  const [exporting, setExporting] = React.useState(false);
  const reqId = React.useRef(0);

  // --- parsing -------------------------------------------------------------
  const parse = React.useCallback((src, name) => {
    const ticket = ++reqId.current;
    setStatus("parsing"); setErrMsg("");
    runCsv("parseEditor", { text: src, delimiter, hasHeader, maxRows: EDITOR_ROW_CAP })
      .then((r) => {
        if (ticket !== reqId.current) return;
        data.current = { headers: r.headers, rows: r.rows };
        setMeta({ name: name || meta.name, total: r.total, capped: r.capped });
        setScrollTop(0);
        if (bodyRef.current) bodyRef.current.scrollTop = 0;
        setStatus("ready");
        force();
      })
      .catch((e) => {
        if (ticket !== reqId.current || (e && e.message === "cancelled")) return;
        setErrMsg((e && e.message) || "Could not parse CSV"); setStatus("error");
      });
  }, [delimiter, hasHeader]); // eslint-disable-line

  const loadFile = async (f) => {
    try {
      const t = await readText(f);
      originalText.current = t;
      setMeta((m) => ({ ...m, name: f.name }));
      parse(t, f.name);
    } catch (e) { setErrMsg("Could not read file"); setStatus("error"); }
  };

  // Re-parse from the original text when delimiter / header interpretation changes.
  const reparse = (d, h) => {
    setDelimiter(d); setHasHeader(h);
    if (originalText.current) {
      const ticket = ++reqId.current;
      setStatus("parsing");
      runCsv("parseEditor", { text: originalText.current, delimiter: d, hasHeader: h, maxRows: EDITOR_ROW_CAP })
        .then((r) => {
          if (ticket !== reqId.current) return;
          data.current = { headers: r.headers, rows: r.rows };
          setMeta((m) => ({ ...m, total: r.total, capped: r.capped }));
          setStatus("ready"); force();
        })
        .catch((e) => { if (ticket === reqId.current) { setErrMsg((e && e.message) || "Parse failed"); setStatus("error"); } });
    }
  };

  const startBlank = () => {
    originalText.current = "";
    data.current = { headers: ["Column 1", "Column 2", "Column 3"], rows: Array.from({ length: 3 }, () => ["", "", ""]) };
    setMeta({ name: "untitled.csv", total: 3, capped: false });
    setStatus("ready"); force();
  };

  const reset = () => {
    originalText.current = ""; data.current = { headers: [], rows: [] };
    setMeta({ name: "", total: 0, capped: false }); setStatus("empty"); setErrMsg("");
  };

  // --- mutations (mutate the ref in place + force a windowed re-render) -----
  const setCell = (r, c, v) => { data.current.rows[r][c] = v; force(); };
  const setHeader = (c, v) => { data.current.headers[c] = v; force(); };
  const addRow = () => { data.current.rows.push(new Array(data.current.headers.length).fill("")); setMeta((m) => ({ ...m, total: m.total + 1 })); force(); };
  const addCol = () => { const d = data.current; d.headers.push("Column " + (d.headers.length + 1)); for (const row of d.rows) row.push(""); force(); };
  const delRow = (r) => { data.current.rows.splice(r, 1); setMeta((m) => ({ ...m, total: Math.max(0, m.total - 1) })); force(); };
  const delCol = (c) => { const d = data.current; d.headers.splice(c, 1); for (const row of d.rows) row.splice(c, 1); force(); };

  // --- export --------------------------------------------------------------
  const buildCsv = () => runCsv("editorToCsv", { headers: data.current.headers, rows: data.current.rows, delimiter, includeHeader: hasHeader })
    .then((r) => r.output);
  const doDownload = () => { setExporting(true); buildCsv().then((t) => { downloadText(t, meta.name || "data.csv", "text/csv"); setExporting(false); }).catch(() => setExporting(false)); };
  const doCopy = () => { setExporting(true); buildCsv().then((t) => { try { navigator.clipboard.writeText(t); } catch (e) { /* no-op */ } setExporting(false); }).catch(() => setExporting(false)); };

  // --- virtualisation ------------------------------------------------------
  React.useLayoutEffect(() => { if (bodyRef.current) setViewportH(bodyRef.current.clientHeight); }, [status]);
  const onScroll = () => {
    const el = bodyRef.current; if (!el) return;
    if (headRef.current) headRef.current.scrollLeft = el.scrollLeft;
    setScrollTop(el.scrollTop);
  };

  const { headers, rows } = data.current;
  const nRows = rows.length;
  const nCols = headers.length;
  const totalW = GUTTER + nCols * COL_W;
  const visibleCount = Math.ceil(viewportH / ROW_H) + OVERSCAN * 2;
  const start = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN);
  const end = Math.min(nRows, start + visibleCount);

  if (status === "empty" || status === "error") {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
        {status === "error" ? <Badge kind="danger">{errMsg}</Badge> : null}
        <Dropzone onFiles={(fs) => loadFile(fs[0])} accept=".csv,.tsv,.txt,text/csv" icon="table-2"
          title="Drop a CSV to edit it" hint="Parsed locally — nothing is uploaded" />
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Button variant="secondary" size="sm" icon="plus" onClick={startBlank}>Or start a blank table</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Select options={DELIMS} value={delimiter} onChange={(e) => reparse(e.target.value, hasHeader)} disabled={!originalText.current} />
        <Switch checked={hasHeader} onChange={(v) => reparse(delimiter, v)} label="Header row" disabled={!originalText.current} />
        <Button variant="secondary" size="sm" icon="plus" onClick={addRow}>Row</Button>
        <Button variant="secondary" size="sm" icon="plus" onClick={addCol}>Column</Button>
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <Button variant="secondary" size="sm" icon="copy" onClick={doCopy} disabled={exporting}>Copy</Button>
          <Button variant="primary" size="sm" icon="download" onClick={doDownload} disabled={exporting}>Download</Button>
          <Button variant="ghost" size="sm" icon="file-up" onClick={reset}>New</Button>
        </span>
      </div>

      {meta.capped ? (
        <Badge kind="warn">Editing the first {EDITOR_ROW_CAP.toLocaleString()} of {meta.total.toLocaleString()} rows — use CSV → JSON / SQL for full-file conversion.</Badge>
      ) : null}

      <Panel variant="raised" title={meta.name || "table"}
        meta={`${nRows.toLocaleString()} rows · ${nCols} cols`}
        style={{ flex: 1, minHeight: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          {/* header (horizontal scroll synced with the body) */}
          <div ref={headRef} style={{ overflow: "hidden", flex: "none", borderBottom: "1px solid var(--border-default)", background: "var(--surface-sunken)" }}>
            <div style={{ width: totalW, display: "flex", height: ROW_H }}>
              <div style={{ width: GUTTER, flex: "none", borderRight: "1px solid var(--border-subtle)" }} />
              {headers.map((h, c) => (
                <div key={c} style={{ width: COL_W, flex: "none", display: "flex", alignItems: "center", borderRight: "1px solid var(--border-subtle)", position: "relative" }}>
                  <input value={h == null ? "" : h} onChange={(e) => setHeader(c, e.target.value)}
                    style={{ ...cellInputStyle, width: "auto", flex: 1, minWidth: 0, fontWeight: 600, color: "var(--text-secondary)" }} />
                  <IconButton icon="x" label="Delete column" size="sm" onClick={() => delCol(c)} style={{ flex: "none", width: 24, height: 24 }} />
                </div>
              ))}
            </div>
          </div>

          {/* virtualised body */}
          <div ref={bodyRef} onScroll={onScroll} style={{ overflow: "auto", flex: 1, minHeight: 0 }}>
            <div style={{ width: totalW, height: nRows * ROW_H, position: "relative" }}>
              <div style={{ position: "absolute", top: start * ROW_H, left: 0, right: 0 }}>
                {rows.slice(start, end).map((row, i) => {
                  const r = start + i;
                  return (
                    <div key={r} style={{ display: "flex", height: ROW_H, borderBottom: "1px solid var(--border-subtle)" }}>
                      <div style={{ width: GUTTER, flex: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px 0 8px", borderRight: "1px solid var(--border-subtle)", background: "var(--surface-sunken)", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                        <span>{r + 1}</span>
                        <IconButton icon="trash-2" label="Delete row" size="sm" onClick={() => delRow(r)} style={{ width: 22, height: 22 }} />
                      </div>
                      {headers.map((_, c) => (
                        <div key={c} style={{ width: COL_W, flex: "none", borderRight: "1px solid var(--border-subtle)" }}>
                          <input value={row[c] == null ? "" : row[c]} onChange={(e) => setCell(r, c, e.target.value)} style={cellInputStyle} spellCheck={false} />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {status === "parsing" ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-tertiary)" }}>
          <Icon name="loader" size={14} /> Parsing…
        </div>
      ) : null}
    </div>
  );
}
