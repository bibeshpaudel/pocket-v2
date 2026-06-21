import React from "react";
import { Icon } from "../core/Icon.jsx";

/** Quiet empty state — icon, one line, optional hint. ≤2 short sentences. */
export function EmptyState({ icon = "inbox", title, hint, style }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 8, padding: "28px 20px", textAlign: "center", fontFamily: "var(--font-sans)", ...style,
    }}>
      <span style={{
        width: 40, height: 40, borderRadius: "var(--radius-md)",
        display: "grid", placeItems: "center",
        background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)",
        color: "var(--text-tertiary)",
      }}><Icon name={icon} size={18} /></span>
      <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)" }}>{title}</span>
      {hint ? <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", maxWidth: 300 }}>{hint}</span> : null}
    </div>
  );
}
