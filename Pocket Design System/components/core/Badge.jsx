import React from "react";

const css = `
.pkt-badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 2px 9px; border-radius: var(--radius-full);
  font-family: var(--font-sans); font-size: var(--text-xs); font-weight: var(--weight-semibold);
  line-height: 1.6; white-space: nowrap;
}
.pkt-badge--neutral { background: var(--surface-hover); color: var(--text-secondary); }
.pkt-badge--accent  { background: var(--accent-soft);  color: var(--amber-700); }
.pkt-badge--ok      { background: var(--ok-soft);      color: var(--ok); }
.pkt-badge--warn    { background: var(--warn-soft);    color: var(--warn); }
.pkt-badge--danger  { background: var(--danger-soft);  color: var(--danger); }
.pkt-badge--dot::before {
  content: ""; width: 6px; height: 6px; border-radius: 999px; background: currentColor;
}
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-badge")) {
  const s = document.createElement("style"); s.id = "pkt-css-badge"; s.textContent = css;
  document.head.appendChild(s);
}

/** Status pill. Earth-toned: ok=moss, danger=clay, warn=ochre. */
export function Badge({ kind = "neutral", dot = false, children }) {
  return (
    <span className={"pkt-badge pkt-badge--" + kind + (dot ? " pkt-badge--dot" : "")}>
      {children}
    </span>
  );
}
