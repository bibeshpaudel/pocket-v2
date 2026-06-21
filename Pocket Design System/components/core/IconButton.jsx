import React from "react";
import { Icon } from "./Icon.jsx";

const css = `
.pkt-iconbtn {
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: var(--radius-md); border: 1px solid transparent;
  background: transparent; color: var(--text-secondary); cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out);
}
.pkt-iconbtn:hover:not(:disabled) { background: var(--surface-hover); color: var(--text-primary); }
.pkt-iconbtn:active:not(:disabled) { transform: translateY(0.5px); }
.pkt-iconbtn:disabled { opacity: 0.45; cursor: default; }
.pkt-iconbtn--outline { border-color: var(--border-default); background: var(--surface-raised); }
.pkt-iconbtn--outline:hover:not(:disabled) { border-color: var(--border-strong); }
.pkt-iconbtn--md { width: 34px; height: 34px; }
.pkt-iconbtn--sm { width: 28px; height: 28px; }
.pkt-iconbtn--active { color: var(--amber-600); background: var(--accent-soft); }
.pkt-iconbtn--active:hover:not(:disabled) { background: var(--accent-soft); color: var(--amber-700); }
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-iconbtn")) {
  const s = document.createElement("style"); s.id = "pkt-css-iconbtn"; s.textContent = css;
  document.head.appendChild(s);
}

/** Square icon-only button. Always pass a label for accessibility. */
export function IconButton({ icon, label, size = "md", variant = "ghost", active = false, fill = false, ...rest }) {
  const cls = ["pkt-iconbtn", "pkt-iconbtn--" + size];
  if (variant === "outline") cls.push("pkt-iconbtn--outline");
  if (active) cls.push("pkt-iconbtn--active");
  return (
    <button type="button" className={cls.join(" ")} aria-label={label} title={label} {...rest}>
      <Icon name={icon} size={size === "sm" ? 14 : 16} style={active && fill ? { fill: "currentColor" } : undefined} />
    </button>
  );
}
