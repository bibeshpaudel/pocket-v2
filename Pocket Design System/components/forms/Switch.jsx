import React from "react";

const css = `
.pkt-switch {
  position: relative; display: inline-flex; align-items: center;
  width: 36px; height: 21px; border-radius: var(--radius-full);
  background: var(--border-strong); border: none; cursor: pointer; padding: 0;
  transition: background var(--duration-base) var(--ease-out);
}
.pkt-switch::after {
  content: ""; position: absolute; left: 2.5px; top: 2.5px;
  width: 16px; height: 16px; border-radius: 999px; background: var(--white-warm);
  box-shadow: var(--shadow-1);
  transition: transform var(--duration-base) var(--ease-out);
}
.pkt-switch[aria-checked="true"] { background: var(--accent); }
.pkt-switch[aria-checked="true"]::after { transform: translateX(15px); }
.pkt-switch:disabled { opacity: 0.45; cursor: default; }
.pkt-switch-row { display: inline-flex; align-items: center; gap: 10px; font-family: var(--font-sans); font-size: var(--text-sm); color: var(--text-primary); cursor: pointer; }
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-switch")) {
  const s = document.createElement("style"); s.id = "pkt-css-switch"; s.textContent = css;
  document.head.appendChild(s);
}

/** Toggle for instant-apply options (Pocket has no "Save" buttons). */
export function Switch({ checked = false, onChange, label, disabled }) {
  const btn = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className="pkt-switch"
      disabled={disabled}
      onClick={() => onChange && onChange(!checked)}
    ></button>
  );
  if (!label) return btn;
  return <span className="pkt-switch-row" onClick={() => !disabled && onChange && onChange(!checked)}>{btn}{label}</span>;
}
