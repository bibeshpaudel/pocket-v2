// Pocket — Text Diff. Two-level diff (line alignment + intra-line word/char highlighting),
// split & inline views, collapsible unchanged regions, ignore options, stats, copyable
// unified diff. Built from DS primitives + tokens. Engine: ./text-diff-core.js.
import React from "react";
import { Panel } from "../../Pocket Design System/components/surfaces/Panel.jsx";
import { Textarea } from "../../Pocket Design System/components/forms/Textarea.jsx";
import { Badge } from "../../Pocket Design System/components/core/Badge.jsx";
import { Button } from "../../Pocket Design System/components/core/Button.jsx";
import { IconButton } from "../../Pocket Design System/components/core/IconButton.jsx";
import { CopyButton } from "../../Pocket Design System/components/core/CopyButton.jsx";
import { SegmentedControl } from "../../Pocket Design System/components/forms/SegmentedControl.jsx";
import { Switch } from "../../Pocket Design System/components/forms/Switch.jsx";
import { EmptyState } from "../../Pocket Design System/components/surfaces/EmptyState.jsx";
import { diffText, toUnified } from "./text-diff-core.js";

const CTX = 3; // lines of context kept around a collapsed run

const SAMPLE_A = `function greet(name) {
  console.log('Hello, ' + name);
  return true;
}

const user = 'world';
greet(user);`;
const SAMPLE_B = `function greet(name, greeting) {
  console.log(greeting + ', ' + name);
  return true;
}

const user = 'World';
greet(user, 'Hi');`;

const css = `
.pkt-diff { font-family: var(--font-mono); font-size: var(--text-sm); line-height: 1.55; flex: 1; min-height: 0; overflow: auto; }
.pkt-diff-split { display: grid; grid-template-columns: auto minmax(0,1fr) auto minmax(0,1fr); }
.pkt-diff-inline { display: grid; grid-template-columns: auto auto auto minmax(0,1fr); }
.pkt-diff-no { padding: 0 10px; text-align: right; color: var(--text-tertiary); user-select: none; white-space: nowrap; border-right: 1px solid var(--border-subtle); }
.pkt-diff-sign { padding: 0 6px; text-align: center; user-select: none; color: var(--text-tertiary); }
.pkt-diff-cell { padding: 0 12px; white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere; min-height: 1.55em; }
.pkt-diff-add { background: var(--ok-soft); }
.pkt-diff-del { background: var(--danger-soft); }
.pkt-diff-s-add { color: var(--ok); }
.pkt-diff-s-del { color: var(--danger); }
.pkt-diff-wadd { border-bottom: 2px solid var(--ok); font-weight: var(--weight-medium); }
.pkt-diff-wdel { border-bottom: 2px solid var(--danger); font-weight: var(--weight-medium); }
.pkt-diff-fold {
  grid-column: 1 / -1; display: flex; align-items: center; gap: 8px; padding: 5px 14px;
  background: var(--surface-app); color: var(--text-tertiary); cursor: pointer;
  border-top: 1px solid var(--border-subtle); border-bottom: 1px solid var(--border-subtle);
  font-size: var(--text-xs); font-family: var(--font-sans);
}
.pkt-diff-fold:hover { color: var(--text-secondary); }
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-diff")) {
  const s = document.createElement("style"); s.id = "pkt-css-diff"; s.textContent = css;
  document.head.appendChild(s);
}

function Segs({ segs, kind }) {
  const cls = kind === "del" ? "pkt-diff-wdel" : "pkt-diff-wadd";
  return segs.map((seg, i) =>
    seg.t === "eq"
      ? <React.Fragment key={i}>{seg.s}</React.Fragment>
      : <span key={i} className={cls}>{seg.s}</span>
  );
}

// Fold long runs of equal rows into a clickable summary.
function buildView(rows, collapse, expanded) {
  if (!collapse) return rows.map((row, i) => ({ kind: "row", row, key: i }));
  const items = [];
  let i = 0;
  while (i < rows.length) {
    if (rows[i].type === "eq") {
      let j = i;
      while (j < rows.length && rows[j].type === "eq") j++;
      const runLen = j - i;
      const id = "f" + i;
      if (runLen > CTX * 2 + 1 && !expanded.has(id)) {
        for (let k = i; k < i + CTX; k++) items.push({ kind: "row", row: rows[k], key: k });
        items.push({ kind: "fold", id, count: runLen - CTX * 2, key: "fold" + i });
        for (let k = j - CTX; k < j; k++) items.push({ kind: "row", row: rows[k], key: k });
      } else {
        for (let k = i; k < j; k++) items.push({ kind: "row", row: rows[k], key: k });
      }
      i = j;
    } else {
      items.push({ kind: "row", row: rows[i], key: i });
      i++;
    }
  }
  return items;
}

function SplitRow({ row }) {
  if (row.type === "eq") return (
    <>
      <div className="pkt-diff-no">{row.leftNo}</div><div className="pkt-diff-cell">{row.text}</div>
      <div className="pkt-diff-no">{row.rightNo}</div><div className="pkt-diff-cell">{row.text}</div>
    </>
  );
  if (row.type === "del") return (
    <>
      <div className="pkt-diff-no pkt-diff-del">{row.leftNo}</div><div className="pkt-diff-cell pkt-diff-del">{row.left}</div>
      <div className="pkt-diff-no" /><div className="pkt-diff-cell" />
    </>
  );
  if (row.type === "add") return (
    <>
      <div className="pkt-diff-no" /><div className="pkt-diff-cell" />
      <div className="pkt-diff-no pkt-diff-add">{row.rightNo}</div><div className="pkt-diff-cell pkt-diff-add">{row.right}</div>
    </>
  );
  return (
    <>
      <div className="pkt-diff-no pkt-diff-del">{row.leftNo}</div>
      <div className="pkt-diff-cell pkt-diff-del"><Segs segs={row.left} kind="del" /></div>
      <div className="pkt-diff-no pkt-diff-add">{row.rightNo}</div>
      <div className="pkt-diff-cell pkt-diff-add"><Segs segs={row.right} kind="add" /></div>
    </>
  );
}

function InlineRows({ row }) {
  if (row.type === "eq") return (
    <>
      <div className="pkt-diff-no">{row.leftNo}</div><div className="pkt-diff-no">{row.rightNo}</div>
      <div className="pkt-diff-sign"> </div><div className="pkt-diff-cell">{row.text}</div>
    </>
  );
  if (row.type === "del") return (
    <>
      <div className="pkt-diff-no pkt-diff-del">{row.leftNo}</div><div className="pkt-diff-no pkt-diff-del" />
      <div className="pkt-diff-sign pkt-diff-del pkt-diff-s-del">−</div><div className="pkt-diff-cell pkt-diff-del">{row.left}</div>
    </>
  );
  if (row.type === "add") return (
    <>
      <div className="pkt-diff-no pkt-diff-add" /><div className="pkt-diff-no pkt-diff-add">{row.rightNo}</div>
      <div className="pkt-diff-sign pkt-diff-add pkt-diff-s-add">+</div><div className="pkt-diff-cell pkt-diff-add">{row.right}</div>
    </>
  );
  return (
    <>
      <div className="pkt-diff-no pkt-diff-del">{row.leftNo}</div><div className="pkt-diff-no pkt-diff-del" />
      <div className="pkt-diff-sign pkt-diff-del pkt-diff-s-del">−</div>
      <div className="pkt-diff-cell pkt-diff-del"><Segs segs={row.left} kind="del" /></div>
      <div className="pkt-diff-no pkt-diff-add" /><div className="pkt-diff-no pkt-diff-add">{row.rightNo}</div>
      <div className="pkt-diff-sign pkt-diff-add pkt-diff-s-add">+</div>
      <div className="pkt-diff-cell pkt-diff-add"><Segs segs={row.right} kind="add" /></div>
    </>
  );
}

export default function TextDiffScreen() {
  const [inputA, setInputA] = React.useState(SAMPLE_A);
  const [inputB, setInputB] = React.useState(SAMPLE_B);
  const [view, setView] = React.useState("Split");
  const [gran, setGran] = React.useState("Word");
  const [ignoreCase, setIgnoreCase] = React.useState(false);
  const [ignoreWhitespace, setIgnoreWhitespace] = React.useState(false);
  const [collapse, setCollapse] = React.useState(true);
  const [expanded, setExpanded] = React.useState(() => new Set());

  const aD = React.useDeferredValue(inputA);
  const bD = React.useDeferredValue(inputB);

  const diff = React.useMemo(
    () => diffText(aD, bD, { gran: gran === "Char" ? "char" : "word", ignoreCase, ignoreWhitespace }),
    [aD, bD, gran, ignoreCase, ignoreWhitespace]
  );

  // Reset fold expansions when the diff structurally changes.
  React.useEffect(() => { setExpanded(new Set()); }, [aD, bD, ignoreCase, ignoreWhitespace, gran]);

  const items = React.useMemo(
    () => (diff.rows ? buildView(diff.rows, collapse, expanded) : []),
    [diff.rows, collapse, expanded]
  );

  const expandFold = (id) => setExpanded((s) => { const n = new Set(s); n.add(id); return n; });
  const swap = () => { setInputA(inputB); setInputB(inputA); };

  const bothEmpty = !inputA.trim() && !inputB.trim();

  const meta = diff.stats ? (
    diff.stats.identical
      ? <Badge kind="ok" dot>Identical</Badge>
      : (
        <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ color: "var(--text-tertiary)" }}>{diff.stats.similarity}% same</span>
          <Badge kind="ok" dot>+{diff.stats.added + diff.stats.changed}</Badge>
          <Badge kind="danger" dot>−{diff.stats.removed + diff.stats.changed}</Badge>
        </span>
      )
  ) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <SegmentedControl options={["Split", "Inline"]} value={view} onChange={setView} />
        <SegmentedControl options={["Word", "Char"]} value={gran} onChange={setGran} />
        <Switch checked={ignoreCase} onChange={setIgnoreCase} label="Ignore case" />
        <Switch checked={ignoreWhitespace} onChange={setIgnoreWhitespace} label="Ignore whitespace" />
        <Switch checked={collapse} onChange={setCollapse} label="Collapse unchanged" />
        <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <Button variant="ghost" size="sm" icon="arrow-left-right" onClick={swap}>Swap</Button>
          <Button variant="ghost" size="sm" icon="rotate-ccw" onClick={() => { setInputA(SAMPLE_A); setInputB(SAMPLE_B); }}>Sample</Button>
        </span>
      </div>

      <div style={{ flex: "0 0 32%", minHeight: 120, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Panel title="Original" variant="sunken" meta={inputA.length.toLocaleString() + " chars"}
          actions={<IconButton icon="x" label="Clear" size="sm" onClick={() => setInputA("")} />}>
          <Textarea bare value={inputA} onChange={(e) => setInputA(e.target.value)}
            placeholder="Paste the original text…" style={{ flex: 1, padding: "12px 14px", minHeight: 0 }} />
        </Panel>
        <Panel title="Changed" variant="sunken" meta={inputB.length.toLocaleString() + " chars"}
          actions={<IconButton icon="x" label="Clear" size="sm" onClick={() => setInputB("")} />}>
          <Textarea bare value={inputB} onChange={(e) => setInputB(e.target.value)}
            placeholder="Paste the changed text…" style={{ flex: 1, padding: "12px 14px", minHeight: 0 }} />
        </Panel>
      </div>

      <Panel title="Diff" variant="sunken" meta={meta}
        actions={diff.rows && !diff.stats.identical ? <CopyButton getText={() => toUnified(diff.rows)} label="Copy diff" /> : null}>
        {bothEmpty ? (
          <div style={{ display: "grid", placeItems: "center", flex: 1 }}>
            <EmptyState icon="file-diff" title="Nothing to compare yet" hint="Paste two versions above to see the differences highlighted." />
          </div>
        ) : diff.tooLarge ? (
          <div style={{ display: "grid", placeItems: "center", flex: 1 }}>
            <EmptyState icon="triangle-alert" title="Input too large to diff" hint="Try comparing smaller sections of text." />
          </div>
        ) : diff.stats.identical ? (
          <div style={{ display: "grid", placeItems: "center", flex: 1 }}>
            <EmptyState icon="equal" title="The two texts are identical"
              hint={ignoreCase || ignoreWhitespace ? "No differences with the current ignore options." : "Character for character, they match."} />
          </div>
        ) : (
          <div className={"pkt-diff " + (view === "Split" ? "pkt-diff-split" : "pkt-diff-inline")}>
            {items.map((it) =>
              it.kind === "fold" ? (
                <div key={it.key} className="pkt-diff-fold" onClick={() => expandFold(it.id)}>
                  ⋯ {it.count} unchanged line{it.count === 1 ? "" : "s"} — click to expand
                </div>
              ) : view === "Split"
                ? <React.Fragment key={it.key}><SplitRow row={it.row} /></React.Fragment>
                : <React.Fragment key={it.key}><InlineRows row={it.row} /></React.Fragment>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}
