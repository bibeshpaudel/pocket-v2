// Pocket — read-only code output with a line-number gutter (sticky on horizontal
// scroll). `html` is the syntax-highlighted markup; `text` is the plain string
// used for the line count. Shared by the JSON / XML formatters.
import React from "react";

export function CodeWithLines({ text, html }) {
  const count = text ? text.split("\n").length : 0;
  const gutter = Array.from({ length: count }, (_, i) => i + 1).join("\n");
  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "auto" }}>
      <pre aria-hidden="true" style={{ margin: 0, padding: "12px 12px 12px 16px", position: "sticky", left: 0,
        background: "var(--code-bg)", color: "var(--syn-comment)", textAlign: "right", userSelect: "none",
        fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.6, flexShrink: 0,
        borderRight: "1px solid var(--border-subtle)" }}>{gutter}</pre>
      <pre style={{ margin: 0, padding: "12px 16px", flex: 1, fontFamily: "var(--font-mono)", fontSize: 13,
        lineHeight: 1.6, color: "var(--code-fg)" }}
        dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
