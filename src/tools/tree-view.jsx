// Pocket — collapsible tree renderers for the JSON / XML formatters' "Tree" view.
// Pure presentational, rendered inside the dark code Panel so it reuses the
// --syn-* / --code-fg syntax tokens for colour. No raw values.
import React from "react";
import { Icon } from "../../Pocket Design System/components/core/Icon.jsx";

const ROW = { fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.7 };
const CHEVRON_W = 15; // keeps leaf rows aligned with collapsible ones
const STEP = 14;      // indent per depth level

// One-time focus ring for keyboard users (inline styles can't do :focus-visible).
if (typeof document !== "undefined" && !document.getElementById("pkt-css-tree")) {
  const s = document.createElement("style");
  s.id = "pkt-css-tree";
  s.textContent = ".pkt-tree-row:focus-visible{outline:2px solid var(--amber-500);outline-offset:-2px;border-radius:var(--radius-sm);}";
  document.head.appendChild(s);
}

// Props that make a collapsible row operable by mouse AND keyboard (Enter/Space),
// and announce its expanded state to assistive tech.
function toggleProps(open, setOpen) {
  const toggle = () => setOpen((o) => !o);
  return {
    className: "pkt-tree-row",
    role: "button",
    tabIndex: 0,
    "aria-expanded": open,
    onClick: toggle,
    onKeyDown: (e) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") { e.preventDefault(); toggle(); }
    },
  };
}

function leafColor(v) {
  if (typeof v === "string") return "var(--syn-string)";
  if (typeof v === "number") return "var(--syn-number)";
  return "var(--syn-keyword)"; // booleans + null
}

function JsonNode({ keyName, value, depth, isArrayItem }) {
  const isObj = value !== null && typeof value === "object";
  const [open, setOpen] = React.useState(depth < 2);

  const keyLabel = keyName != null ? (
    <>
      <span style={{ color: "var(--syn-key)" }}>{isArrayItem ? keyName : JSON.stringify(keyName)}</span>
      <span style={{ color: "var(--syn-punct)" }}>: </span>
    </>
  ) : null;

  if (!isObj) {
    const text = typeof value === "string" ? JSON.stringify(value) : String(value);
    return (
      <div style={{ ...ROW, paddingLeft: depth * STEP, display: "flex", alignItems: "center" }}>
        <span style={{ width: CHEVRON_W, flexShrink: 0 }} />
        {keyLabel}
        <span style={{ color: leafColor(value) }}>{text}</span>
      </div>
    );
  }

  const isArr = Array.isArray(value);
  const entries = isArr ? value.map((v, i) => [i, v]) : Object.entries(value);
  const openBr = isArr ? "[" : "{";
  const closeBr = isArr ? "]" : "}";

  return (
    <div>
      <div style={{ ...ROW, paddingLeft: depth * STEP, cursor: "pointer", display: "flex", alignItems: "center" }}
        {...toggleProps(open, setOpen)}>
        <Icon name={open ? "chevron-down" : "chevron-right"} size={13} strokeWidth={2}
          style={{ color: "var(--syn-punct)", flexShrink: 0, width: CHEVRON_W }} />
        {keyLabel}
        <span style={{ color: "var(--syn-punct)" }}>{open ? openBr : openBr + "…" + closeBr}</span>
        {!open && <span style={{ color: "var(--text-tertiary)", marginLeft: 8 }}>{entries.length} {isArr ? "items" : "keys"}</span>}
      </div>
      {open && (
        <>
          {entries.map(([k, v]) => (
            <JsonNode key={k} keyName={k} value={v} depth={depth + 1} isArrayItem={isArr} />
          ))}
          <div style={{ ...ROW, paddingLeft: depth * STEP, display: "flex", alignItems: "center" }}>
            <span style={{ width: CHEVRON_W, flexShrink: 0 }} />
            <span style={{ color: "var(--syn-punct)" }}>{closeBr}</span>
          </div>
        </>
      )}
    </div>
  );
}

export function JsonTree({ data }) {
  return (
    <div style={{ padding: "12px 16px", overflow: "auto", flex: 1, minHeight: 0 }}>
      <JsonNode value={data} depth={0} />
    </div>
  );
}

function TagName({ name }) {
  return <span style={{ color: "var(--syn-keyword)" }}>{name}</span>;
}

function tagAttrs(el) {
  return Array.from(el.attributes || []).map((a) => (
    <React.Fragment key={a.name}>
      {" "}
      <span style={{ color: "var(--syn-key)" }}>{a.name}</span>
      <span style={{ color: "var(--syn-punct)" }}>=</span>
      <span style={{ color: "var(--syn-string)" }}>"{a.value}"</span>
    </React.Fragment>
  ));
}

function XmlNode({ node, depth }) {
  const [open, setOpen] = React.useState(depth < 3);
  const childEls = Array.from(node.childNodes).filter((n) => n.nodeType === 1);
  const text = Array.from(node.childNodes)
    .filter((n) => n.nodeType === 3)
    .map((n) => n.nodeValue)
    .join("")
    .trim();
  const attrs = tagAttrs(node);

  // Leaf element — no child elements: render on a single line.
  if (childEls.length === 0) {
    return (
      <div style={{ ...ROW, paddingLeft: depth * STEP, display: "flex", alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ width: CHEVRON_W, flexShrink: 0 }} />
        <span style={{ color: "var(--syn-punct)" }}>{"<"}</span>
        <TagName name={node.tagName} />
        {attrs}
        {text ? (
          <>
            <span style={{ color: "var(--syn-punct)" }}>{">"}</span>
            <span style={{ color: "var(--syn-string)" }}>{text}</span>
            <span style={{ color: "var(--syn-punct)" }}>{"</"}</span>
            <TagName name={node.tagName} />
            <span style={{ color: "var(--syn-punct)" }}>{">"}</span>
          </>
        ) : (
          <span style={{ color: "var(--syn-punct)" }}>{" />"}</span>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ ...ROW, paddingLeft: depth * STEP, cursor: "pointer", display: "flex", alignItems: "center" }}
        {...toggleProps(open, setOpen)}>
        <Icon name={open ? "chevron-down" : "chevron-right"} size={13} strokeWidth={2}
          style={{ color: "var(--syn-punct)", flexShrink: 0, width: CHEVRON_W }} />
        <span style={{ color: "var(--syn-punct)" }}>{"<"}</span>
        <TagName name={node.tagName} />
        {attrs}
        <span style={{ color: "var(--syn-punct)" }}>{">"}</span>
        {!open && <span style={{ color: "var(--text-tertiary)", marginLeft: 8 }}>{childEls.length} children</span>}
      </div>
      {open && (
        <>
          {childEls.map((c, i) => <XmlNode key={i} node={c} depth={depth + 1} />)}
          <div style={{ ...ROW, paddingLeft: depth * STEP, display: "flex", alignItems: "center" }}>
            <span style={{ width: CHEVRON_W, flexShrink: 0 }} />
            <span style={{ color: "var(--syn-punct)" }}>{"</"}</span>
            <TagName name={node.tagName} />
            <span style={{ color: "var(--syn-punct)" }}>{">"}</span>
          </div>
        </>
      )}
    </div>
  );
}

export function XmlTree({ doc }) {
  const root = doc && doc.documentElement;
  if (!root) return null;
  return (
    <div style={{ padding: "12px 16px", overflow: "auto", flex: 1, minHeight: 0 }}>
      <XmlNode node={root} depth={0} />
    </div>
  );
}
