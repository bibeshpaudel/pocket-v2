import React from "react";

const css = `
.pkt-tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--border-default); font-family: var(--font-sans); }
.pkt-tabs__tab {
  position: relative; height: 36px; padding: 0 14px; border: none; background: transparent;
  font-size: var(--text-sm); font-weight: var(--weight-medium); color: var(--text-secondary);
  cursor: pointer; transition: color var(--duration-fast) var(--ease-out);
}
.pkt-tabs__tab:hover { color: var(--text-primary); }
.pkt-tabs__tab--on { color: var(--text-primary); font-weight: var(--weight-semibold); }
.pkt-tabs__tab--on::after {
  content: ""; position: absolute; left: 10px; right: 10px; bottom: -1px; height: 2px;
  background: var(--accent); border-radius: 2px;
}
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-tabs")) {
  const s = document.createElement("style"); s.id = "pkt-css-tabs"; s.textContent = css;
  document.head.appendChild(s);
}

/** Underline tabs for switching views within a tool (e.g. Output / Errors). */
export function Tabs({ items = [], active, onChange }) {
  return (
    <div className="pkt-tabs" role="tablist">
      {items.map((it) => {
        const item = typeof it === "string" ? { id: it, label: it } : it;
        const on = item.id === active;
        return (
          <button key={item.id} type="button" role="tab" aria-selected={on}
            className={"pkt-tabs__tab" + (on ? " pkt-tabs__tab--on" : "")}
            onClick={() => onChange && onChange(item.id)}>
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
