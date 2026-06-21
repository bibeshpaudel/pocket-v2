import React from "react";
import { Icon } from "./Icon.jsx";

const css = `
.pkt-copybtn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 28px; padding: 0 10px;
  font-family: var(--font-sans); font-size: var(--text-xs); font-weight: var(--weight-semibold);
  color: var(--text-secondary); background: transparent;
  border: 1px solid var(--border-default); border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out);
}
.pkt-copybtn:hover { background: var(--surface-hover); color: var(--text-primary); }
.pkt-copybtn--copied, .pkt-copybtn--copied:hover { color: var(--ok); border-color: var(--ok-soft); background: var(--ok-soft); }
.pkt-copybtn--dark { border-color: var(--code-line); color: var(--syn-punct); }
.pkt-copybtn--dark:hover { background: var(--code-line); color: var(--code-fg); }
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-copybtn")) {
  const s = document.createElement("style"); s.id = "pkt-css-copybtn"; s.textContent = css;
  document.head.appendChild(s);
}

/** Copies `text` (or getText()) to the clipboard; confirms inline for 1.5s. */
export function CopyButton({ text, getText, label = "Copy", onDark = false, ...rest }) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef(null);
  const handle = () => {
    const value = getText ? getText() : text;
    try { navigator.clipboard.writeText(value == null ? "" : String(value)); } catch (e) { /* no-op */ }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1500);
  };
  React.useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <button
      type="button"
      className={"pkt-copybtn" + (copied ? " pkt-copybtn--copied" : "") + (onDark ? " pkt-copybtn--dark" : "")}
      onClick={handle}
      {...rest}
    >
      <Icon name={copied ? "check" : "copy"} size={13} />
      {copied ? "Copied" : label}
    </button>
  );
}
