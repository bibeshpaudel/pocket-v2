import React from "react";

const css = `
.pkt-seg {
  display: inline-flex; gap: 2px; padding: 3px;
  background: var(--surface-sunken); border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}
.pkt-seg__opt {
  height: 26px; padding: 0 12px; border: none; border-radius: 7px;
  font-family: var(--font-sans); font-size: var(--text-xs); font-weight: var(--weight-semibold);
  color: var(--text-secondary); background: transparent; cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out);
}
.pkt-seg__opt:hover { color: var(--text-primary); }
.pkt-seg__opt--on { background: var(--surface-raised); color: var(--text-primary); box-shadow: var(--shadow-1); border: 1px solid var(--border-default); height: 26px; }
.pkt-seg__opt--mono { font-family: var(--font-mono); }
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-seg")) {
  const s = document.createElement("style"); s.id = "pkt-css-seg"; s.textContent = css;
  document.head.appendChild(s);
}

/** Compact mode picker (2–5 short options), e.g. encode/decode, v1/v4. */
export function SegmentedControl({ options = [], value, onChange, mono = false }) {
  return (
    <div className="pkt-seg" role="tablist">
      {options.map((o) => {
        const opt = typeof o === "string" ? { value: o, label: o } : o;
        const on = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={on}
            className={"pkt-seg__opt" + (on ? " pkt-seg__opt--on" : "") + (mono ? " pkt-seg__opt--mono" : "")}
            onClick={() => onChange && onChange(opt.value)}
          >{opt.label}</button>
        );
      })}
    </div>
  );
}
