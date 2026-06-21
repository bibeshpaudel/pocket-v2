import React from "react";
import { Icon } from "../core/Icon.jsx";

const css = `
.pkt-toast {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 9px 14px; border-radius: var(--radius-md);
  background: var(--surface-inverse); color: var(--text-inverse);
  font-family: var(--font-sans); font-size: var(--text-sm); font-weight: var(--weight-medium);
  box-shadow: var(--shadow-2);
}
.pkt-toast--ok .pkt-toast__icon { color: #A8C078; }
.pkt-toast--danger .pkt-toast__icon { color: #E08A76; }
.pkt-toast__icon { display: inline-flex; }
@keyframes pkt-toast-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
.pkt-toast { animation: pkt-toast-in var(--duration-base) var(--ease-out); }
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-toast")) {
  const s = document.createElement("style"); s.id = "pkt-css-toast"; s.textContent = css;
  document.head.appendChild(s);
}

/** Inverse-ink confirmation capsule. Place fixed bottom-center; auto-dismiss ~2s.
    Reserve for events without inline feedback (CopyButton confirms itself). */
export function Toast({ kind = "ok", icon, children, style }) {
  const glyph = icon || (kind === "ok" ? "check" : kind === "danger" ? "alert-circle" : "info");
  return (
    <div className={"pkt-toast pkt-toast--" + kind} style={style} role="status">
      <span className="pkt-toast__icon"><Icon name={glyph} size={14} /></span>
      {children}
    </div>
  );
}
