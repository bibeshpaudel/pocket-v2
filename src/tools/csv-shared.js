// Pocket — shared CSV engine (pure JS, no React, no DOM).
// Used both on the main thread (fallback) and inside the CSV Web Worker, so it
// must stay framework-free. Everything is written for LARGE input: a single-pass
// character-scanning parser (no catastrophic-backtracking regex) and streaming
// string builders that hold at most one row's worth of intermediate objects.

// Cap on how much generated text we ship back for on-screen PREVIEW. The full
// output is always returned too (for Copy / Download); only the DOM preview is
// trimmed so a 100 MB result never freezes a <textarea>.
export const PREVIEW_LIMIT = 200000;

// Default ceiling on rows materialised into the editable grid (DOM + memory safety).
export const EDITOR_ROW_CAP = 50000;

const DELIM_CANDIDATES = [",", ";", "\t", "|"];

export function detectDelimiter(sample) {
  if (!sample) return ",";
  const nl = sample.indexOf("\n");
  const firstLine = (nl === -1 ? sample.slice(0, 4000) : sample.slice(0, nl)).replace(/\r$/, "");
  let best = ",", bestCount = -1;
  for (const c of DELIM_CANDIDATES) {
    // count occurrences outside the cheap-and-good-enough heuristic of the header line
    let count = 0, i = -1;
    while ((i = firstLine.indexOf(c, i + 1)) !== -1) count++;
    if (count > bestCount) { bestCount = count; best = c; }
  }
  return best;
}

export function resolveDelimiter(delim, text) {
  if (delim == null || delim === "auto") return detectDelimiter(text || "");
  return delim;
}

// Single-pass RFC-4180-ish CSV parser. Handles quoted fields, doubled-quote
// escapes ("" -> "), embedded delimiters/newlines, and LF / CRLF / lone-CR line
// endings. O(n) time, O(1) extra state besides the result. onProgress(0..1).
export function parseCSV(text, delimiter, onProgress) {
  const d = delimiter || ",";
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;
  let started = false; // did the current row begin? (so a trailing newline adds no empty row)
  const len = text.length;
  let nextTick = 1 << 19; // ~500k chars between progress reports
  for (let i = 0; i < len; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text.charCodeAt(i + 1) === 34) { field += '"'; i++; } // "" escape
        else inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true; started = true;
    } else if (ch === d) {
      row.push(field); field = ""; started = true;
    } else if (ch === "\n") {
      row.push(field); rows.push(row); row = []; field = ""; started = false;
    } else if (ch === "\r") {
      if (text.charCodeAt(i + 1) === 10) { /* CRLF: let the \n close the row */ }
      else { row.push(field); rows.push(row); row = []; field = ""; started = false; }
    } else {
      field += ch; started = true;
    }
    if (i >= nextTick) { nextTick = i + (1 << 19); if (onProgress) onProgress(i / len); }
  }
  // Flush any trailing field / row that wasn't terminated by a newline.
  if (started || field !== "" || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

function needsQuote(s, d) {
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === d || ch === '"' || ch === "\n" || ch === "\r") return true;
  }
  return false;
}

export function csvField(s, d) {
  s = s == null ? "" : String(s);
  if (needsQuote(s, d)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

// Coerce a CSV string cell to a typed JS value (for typed JSON / SQL).
// Leading-zero numbers ("007") and oversized ints stay strings so IDs survive.
export function inferValue(s) {
  if (s === "" || s == null) return null;
  if (s === "true") return true;
  if (s === "false") return false;
  if (s.length <= 15 && /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(s)) {
    const n = Number(s);
    if (Number.isFinite(n)) return n;
  }
  return s;
}

function dedupeHeaders(raw, colCount) {
  const n = Math.max(colCount, raw.length);
  const seen = Object.create(null);
  const out = [];
  for (let i = 0; i < n; i++) {
    let name = (raw[i] == null ? "" : String(raw[i])).trim();
    if (!name) name = "field_" + (i + 1);
    let candidate = name, k = 2;
    while (seen[candidate]) candidate = name + "_" + k++;
    seen[candidate] = true;
    out.push(candidate);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Job dispatcher — the single entry point the worker and the main-thread
// fallback both call. Each job returns a plain, structured-clone-safe object.
// ---------------------------------------------------------------------------
export function runJob(op, payload, onProgress) {
  switch (op) {
    case "csvToJson": return csvToJson(payload, onProgress);
    case "csvToSql": return csvToSql(payload, onProgress);
    case "jsonToCsv": return jsonToCsv(payload, onProgress);
    case "parseEditor": return parseEditor(payload, onProgress);
    case "editorToCsv": return editorToCsv(payload, onProgress);
    default: throw new Error("Unknown CSV op: " + op);
  }
}

function withPreview(output, extra) {
  const truncated = output.length > PREVIEW_LIMIT;
  return Object.assign({ output, preview: truncated ? output.slice(0, PREVIEW_LIMIT) : output, truncated }, extra);
}

function splitHeader(rows, hasHeader) {
  const colCount = rows.reduce((m, r) => (r.length > m ? r.length : m), 0);
  if (hasHeader && rows.length) {
    return { headers: dedupeHeaders(rows[0], colCount), dataRows: rows.slice(1), colCount };
  }
  const headers = [];
  for (let i = 0; i < colCount; i++) headers.push("field_" + (i + 1));
  return { headers, dataRows: rows, colCount };
}

function csvToJson(p, onProgress) {
  const { text, hasHeader = true, typed = true, shape = "objects", pretty = true } = p;
  const d = resolveDelimiter(p.delimiter, text);
  const rows = parseCSV(text, d, (f) => onProgress && onProgress(f * 0.5));
  const { headers, dataRows } = splitHeader(rows, hasHeader);
  const n = dataRows.length;
  const conv = typed ? inferValue : (s) => (s == null ? "" : s);
  const indentArr = pretty ? "  " : "";
  let out = "[" + (pretty ? "\n" : "");
  for (let i = 0; i < n; i++) {
    const r = dataRows[i];
    let value;
    if (shape === "arrays") {
      const a = new Array(r.length);
      for (let c = 0; c < r.length; c++) a[c] = conv(r[c]);
      value = a;
    } else {
      const o = {};
      for (let c = 0; c < headers.length; c++) o[headers[c]] = conv(r[c] === undefined ? "" : r[c]);
      value = o;
    }
    let s = JSON.stringify(value, null, pretty ? 2 : 0);
    if (pretty) s = indentArr + s.split("\n").join("\n" + indentArr);
    out += s + (i < n - 1 ? "," : "") + (pretty ? "\n" : "");
    if (onProgress && (i & 8191) === 0) onProgress(0.5 + (n ? i / n : 1) * 0.5);
  }
  out += "]";
  return withPreview(out, { rowCount: n, colCount: headers.length });
}

// ---- SQL --------------------------------------------------------------------
const SQL_TYPES = {
  mysql:      { int: "INT",     float: "DOUBLE",           bool: "BOOLEAN", text: "TEXT" },
  postgresql: { int: "INTEGER", float: "DOUBLE PRECISION", bool: "BOOLEAN", text: "TEXT" },
  sqlite:     { int: "INTEGER", float: "REAL",             bool: "INTEGER", text: "TEXT" },
  sqlserver:  { int: "INT",     float: "FLOAT",            bool: "BIT",     text: "NVARCHAR(255)" },
};

function quoteIdent(name, dialect) {
  const s = String(name == null ? "" : name);
  if (dialect === "mysql") return "`" + s.replace(/`/g, "``") + "`";
  if (dialect === "sqlserver") return "[" + s.replace(/]/g, "]]") + "]";
  return '"' + s.replace(/"/g, '""') + '"'; // postgresql / sqlite / standard
}

function sqlString(s, dialect) {
  let v = String(s).replace(/'/g, "''");
  if (dialect === "mysql") v = v.replace(/\\/g, "\\\\");
  return "'" + v + "'";
}

function sqlValue(raw, dialect, typed) {
  if (raw == null || raw === "") return "NULL";
  if (!typed) return sqlString(raw, dialect);
  const v = inferValue(raw);
  if (v === null) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") {
    if (dialect === "sqlite" || dialect === "sqlserver") return v ? "1" : "0";
    return v ? "TRUE" : "FALSE";
  }
  return sqlString(v, dialect);
}

function inferColumnType(dataRows, col, dialect) {
  const t = SQL_TYPES[dialect] || SQL_TYPES.mysql;
  // Mirror inferValue() so the declared column type matches how the INSERT
  // values are emitted (e.g. leading-zero "007" stays a string -> TEXT).
  let sawValue = false, allInt = true, allNum = true, allBool = true;
  const limit = Math.min(dataRows.length, 1000);
  for (let i = 0; i < limit; i++) {
    const cell = dataRows[i][col];
    if (cell == null || cell === "") continue;
    sawValue = true;
    const v = inferValue(cell);
    if (typeof v !== "boolean") allBool = false;
    if (typeof v !== "number") { allInt = false; allNum = false; }
    else if (!Number.isInteger(v)) allInt = false;
  }
  if (!sawValue) return t.text;
  if (allBool) return t.bool;
  if (allInt) return t.int;
  if (allNum) return t.float;
  return t.text;
}

function csvToSql(p, onProgress) {
  const {
    text, hasHeader = true, typed = true, dialect = "mysql",
    table = "my_table", createTable = false, multiRow = true, batchSize = 500,
  } = p;
  const d = resolveDelimiter(p.delimiter, text);
  const rows = parseCSV(text, d, (f) => onProgress && onProgress(f * 0.5));
  const { headers, dataRows, colCount } = splitHeader(rows, hasHeader);
  const cols = headers.slice(0, colCount);
  const tbl = quoteIdent(table || "my_table", dialect);
  const colList = cols.map((c) => quoteIdent(c, dialect)).join(", ");
  let out = "";

  if (createTable) {
    const defs = cols.map((c, idx) => "  " + quoteIdent(c, dialect) + " " + inferColumnType(dataRows, idx, dialect));
    out += "CREATE TABLE " + tbl + " (\n" + defs.join(",\n") + "\n);\n\n";
  }

  const n = dataRows.length;
  const batch = Math.max(1, Math.min(Number(batchSize) || 500, 50000));
  const tuple = (r) => {
    const vals = new Array(cols.length);
    for (let c = 0; c < cols.length; c++) vals[c] = sqlValue(r[c], dialect, typed);
    return "(" + vals.join(", ") + ")";
  };

  if (multiRow) {
    for (let i = 0; i < n; i += batch) {
      const end = Math.min(i + batch, n);
      const parts = [];
      for (let j = i; j < end; j++) parts.push("  " + tuple(dataRows[j]));
      out += "INSERT INTO " + tbl + " (" + colList + ") VALUES\n" + parts.join(",\n") + ";\n";
      if (onProgress) onProgress(0.5 + (n ? end / n : 1) * 0.5);
    }
  } else {
    for (let i = 0; i < n; i++) {
      out += "INSERT INTO " + tbl + " (" + colList + ") VALUES " + tuple(dataRows[i]) + ";\n";
      if (onProgress && (i & 8191) === 0) onProgress(0.5 + (n ? i / n : 1) * 0.5);
    }
  }
  return withPreview(out, { rowCount: n, colCount: cols.length });
}

// ---- JSON -> CSV ------------------------------------------------------------
function cellFromJsonValue(v) {
  if (v == null) return "";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function jsonToCsv(p, onProgress) {
  const { text } = p;
  const d = resolveDelimiter(p.delimiter, "");
  const delim = d === "auto" ? "," : d;
  let data;
  try { data = JSON.parse(text); }
  catch (e) { throw new Error("Input is not valid JSON: " + ((e && e.message) || "parse error")); }

  let arr;
  if (Array.isArray(data)) arr = data;
  else if (data && typeof data === "object") arr = [data];
  else arr = [{ value: data }];
  if (!arr.length) return withPreview("", { rowCount: 0, colCount: 0 });

  const arrayOfArrays = arr.every((x) => Array.isArray(x));
  let out = "";
  let rowCount = 0, colCount = 0;

  if (arrayOfArrays) {
    colCount = arr.reduce((m, r) => (r.length > m ? r.length : m), 0);
    for (let i = 0; i < arr.length; i++) {
      const r = arr[i];
      const cells = new Array(colCount);
      for (let c = 0; c < colCount; c++) cells[c] = csvField(cellFromJsonValue(r[c]), delim);
      out += cells.join(delim) + (i < arr.length - 1 ? "\n" : "");
      rowCount++;
      if (onProgress && (i & 8191) === 0) onProgress(i / arr.length);
    }
  } else {
    // Union of keys, in first-seen order, across all objects.
    const keys = [];
    const seen = Object.create(null);
    for (const item of arr) {
      if (item && typeof item === "object" && !Array.isArray(item)) {
        for (const k of Object.keys(item)) if (!seen[k]) { seen[k] = true; keys.push(k); }
      }
    }
    if (!keys.length) keys.push("value");
    colCount = keys.length;
    out += keys.map((k) => csvField(k, delim)).join(delim) + "\n";
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      const cells = new Array(keys.length);
      for (let c = 0; c < keys.length; c++) {
        const v = item && typeof item === "object" && !Array.isArray(item) ? item[keys[c]] : (keys[c] === "value" ? item : undefined);
        cells[c] = csvField(cellFromJsonValue(v), delim);
      }
      out += cells.join(delim) + (i < arr.length - 1 ? "\n" : "");
      rowCount++;
      if (onProgress && (i & 8191) === 0) onProgress(i / arr.length);
    }
  }
  return withPreview(out, { rowCount, colCount });
}

// ---- Editor -----------------------------------------------------------------
function parseEditor(p, onProgress) {
  const { text, hasHeader = true, maxRows = EDITOR_ROW_CAP } = p;
  const d = resolveDelimiter(p.delimiter, text);
  const all = parseCSV(text, d, onProgress);
  const colCount = all.reduce((m, r) => (r.length > m ? r.length : m), 0) || 1;
  let headers, body;
  if (hasHeader && all.length) {
    headers = all[0].slice();
    body = all.slice(1);
  } else {
    headers = [];
    body = all;
  }
  while (headers.length < colCount) headers.push("Column " + (headers.length + 1));
  if (headers.length > colCount) headers = headers.slice(0, colCount);

  const total = body.length;
  const capped = total > maxRows;
  const rows = capped ? body.slice(0, maxRows) : body;
  // Normalise every row to the column count so the grid is rectangular.
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (r.length < headers.length) { while (r.length < headers.length) r.push(""); }
    else if (r.length > headers.length) rows[i] = r.slice(0, headers.length);
  }
  return { headers, rows, total, capped, colCount: headers.length, delimiter: d };
}

function editorToCsv(p, onProgress) {
  const { headers, rows, includeHeader = true } = p;
  const d = resolveDelimiter(p.delimiter, "");
  const delim = d === "auto" ? "," : d;
  let out = "";
  if (includeHeader) out += headers.map((h) => csvField(h, delim)).join(delim) + (rows.length ? "\n" : "");
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const cells = new Array(r.length);
    for (let c = 0; c < r.length; c++) cells[c] = csvField(r[c], delim);
    out += cells.join(delim) + (i < rows.length - 1 ? "\n" : "");
    if (onProgress && (i & 8191) === 0) onProgress(rows.length ? i / rows.length : 1);
  }
  return withPreview(out, { rowCount: rows.length, colCount: headers.length });
}
