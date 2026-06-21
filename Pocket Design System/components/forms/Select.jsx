import React from "react";
import { Icon } from "../core/Icon.jsx";

const css = `
.pkt-select-wrap { position: relative; display: inline-flex; align-items: center; }
.pkt-select {
  appearance: none; -webkit-appearance: none;
  height: 34px; padding: 0 32px 0 12px; min-width: 120px;
  font-family: var(--font-sans); font-size: var(--text-sm); font-weight: var(--weight-medium);
  color: var(--text-primary); background: var(--surface-raised);
  border: 1px solid var(--border-default); border-radius: var(--radius-md);
  cursor: pointer;
  transition: border-color var(--duration-fast) var(--ease-out);
}
.pkt-select:hover { border-color: var(--border-strong); }
.pkt-select:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.pkt-select-wrap .pkt-select-chev { position: absolute; right: 10px; pointer-events: none; color: var(--text-tertiary); }
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-select")) {
  const s = document.createElement("style"); s.id = "pkt-css-select"; s.textContent = css;
  document.head.appendChild(s);
}

/** Native select with Pocket chrome. options: [{value, label}] or strings. */
export function Select({ options = [], value, onChange, style, ...rest }) {
  return (
    <span className="pkt-select-wrap" style={style}>
      <select className="pkt-select" value={value} onChange={onChange} {...rest}>
        {options.map((o) => {
          const opt = typeof o === "string" ? { value: o, label: o } : o;
          return <option key={opt.value} value={opt.value}>{opt.label}</option>;
        })}
      </select>
      <Icon name="chevron-down" size={14} className="pkt-select-chev" />
    </span>
  );
}
