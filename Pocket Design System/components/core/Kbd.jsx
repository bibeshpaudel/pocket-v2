import React from "react";

const css = `
.pkt-kbd {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 20px; padding: 2px 7px;
  font-family: var(--font-mono); font-size: 11px; line-height: 1.4;
  color: var(--text-secondary);
  background: var(--surface-sunken);
  border: 1px solid var(--border-default); border-bottom-width: 2px;
  border-radius: var(--radius-sm);
}
.pkt-kbd-group { display: inline-flex; gap: 4px; vertical-align: middle; }
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-kbd")) {
  const s = document.createElement("style"); s.id = "pkt-css-kbd"; s.textContent = css;
  document.head.appendChild(s);
}

/** Keyboard shortcut capsule(s). Pass keys as an array: ["⌘","K"]. */
export function Kbd({ keys, children }) {
  const list = keys || (children != null ? [children] : []);
  return (
    <span className="pkt-kbd-group">
      {list.map((k, i) => <kbd key={i} className="pkt-kbd">{k}</kbd>)}
    </span>
  );
}
