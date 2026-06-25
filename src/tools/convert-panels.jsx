// Pocket — shared two-panel "input → output" scaffold for the small text/convert
// tools (editable input on the left, read-only code output on the right with
// copy + status badge). Keeps these tools consistent without new UI components.
import React from "react";
import { Panel } from "../../Pocket Design System/components/surfaces/Panel.jsx";
import { Textarea } from "../../Pocket Design System/components/forms/Textarea.jsx";
import { Badge } from "../../Pocket Design System/components/core/Badge.jsx";
import { CopyButton } from "../../Pocket Design System/components/core/CopyButton.jsx";
import { IconButton } from "../../Pocket Design System/components/core/IconButton.jsx";

// Read-only code output with a sticky line-number gutter.
function LinedOutput({ text }) {
  const count = text ? text.split("\n").length : 0;
  const gutter = Array.from({ length: count }, (_, i) => i + 1).join("\n");
  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "auto" }}>
      <pre aria-hidden="true" style={{ margin: 0, padding: "12px 12px 12px 16px", position: "sticky", left: 0,
        background: "var(--code-bg)", color: "var(--syn-comment)", textAlign: "right", userSelect: "none",
        fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.6, flexShrink: 0,
        borderRight: "1px solid var(--border-subtle)" }}>{gutter}</pre>
      <pre style={{ margin: 0, padding: "12px 16px", flex: 1, fontFamily: "var(--font-mono)", fontSize: 13,
        lineHeight: 1.6, color: "var(--code-fg)" }}>{text}</pre>
    </div>
  );
}

export function ConvertPanels({
  inputTitle = "Input", outputTitle = "Output", value, onChange, placeholder,
  output = "", error = null, okLabel = "OK", inputMeta, outputActions, lineNumbers = false,
}) {
  const chars = value ? value.length : 0;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, flex: 1, minHeight: 0 }}>
      <Panel variant="sunken" title={inputTitle}
        meta={inputMeta != null ? inputMeta : (chars ? chars.toLocaleString() + " chars" : null)}
        actions={value ? <IconButton icon="x" label="Clear" size="sm" onClick={() => onChange("")} /> : null}
        style={{ minHeight: 0 }}>
        <Textarea bare value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          style={{ flex: 1, padding: "12px 16px", minHeight: 0 }} />
      </Panel>

      <Panel variant="code" title={outputTitle}
        meta={error ? <Badge kind="danger">Error</Badge> : (output ? <Badge kind="ok" dot>{okLabel}</Badge> : null)}
        actions={!error && output ? (outputActions != null ? outputActions : <CopyButton onDark getText={() => output} />) : null}
        style={{ minHeight: 0 }}>
        {error ? (
          <div style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: 13, color: "#E08A76", whiteSpace: "pre-wrap" }}>{error}</div>
        ) : lineNumbers && output ? (
          <LinedOutput text={output} />
        ) : (
          <Textarea bare readOnly value={output} style={{ flex: 1, padding: "12px 16px", minHeight: 0, color: "var(--code-fg)" }} />
        )}
      </Panel>
    </div>
  );
}
