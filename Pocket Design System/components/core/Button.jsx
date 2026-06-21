import React from "react";
import { Icon } from "./Icon.jsx";

const css = `
.pkt-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  font-family: var(--font-sans); font-weight: var(--weight-semibold);
  border-radius: var(--radius-md); border: 1px solid transparent;
  cursor: pointer; white-space: nowrap; user-select: none;
  transition: background var(--duration-fast) var(--ease-out),
              border-color var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out);
}
.pkt-btn:active:not(:disabled) { transform: translateY(0.5px); }
.pkt-btn:disabled { opacity: 0.45; cursor: default; }

.pkt-btn--md { height: 34px; padding: 0 14px; font-size: var(--text-sm); }
.pkt-btn--sm { height: 28px; padding: 0 10px; font-size: var(--text-xs); }
.pkt-btn--lg { height: 40px; padding: 0 18px; font-size: var(--text-base); }

.pkt-btn--primary { background: var(--accent); color: var(--text-on-accent); }
.pkt-btn--primary:hover:not(:disabled) { background: var(--accent-strong); }

.pkt-btn--secondary { background: var(--surface-raised); border-color: var(--border-default); color: var(--text-primary); }
.pkt-btn--secondary:hover:not(:disabled) { background: var(--surface-hover); border-color: var(--border-strong); }

.pkt-btn--ghost { background: transparent; color: var(--text-secondary); }
.pkt-btn--ghost:hover:not(:disabled) { background: var(--surface-hover); color: var(--text-primary); }

.pkt-btn--danger { background: var(--danger-soft); color: var(--danger); }
.pkt-btn--danger:hover:not(:disabled) { background: var(--danger); color: #FFFDF8; }
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-button")) {
  const s = document.createElement("style"); s.id = "pkt-css-button"; s.textContent = css;
  document.head.appendChild(s);
}

/** Pocket button. Primary is amber with dark ink text; one per view. */
export function Button({ variant = "primary", size = "md", icon, children, ...rest }) {
  const iconSize = size === "sm" ? 13 : size === "lg" ? 17 : 15;
  return (
    <button type="button" className={"pkt-btn pkt-btn--" + size + " pkt-btn--" + variant} {...rest}>
      {icon ? <Icon name={icon} size={iconSize} /> : null}
      {children}
    </button>
  );
}
