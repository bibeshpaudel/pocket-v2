import React from "react";
import { Panel } from "../../../Pocket Design System/components/surfaces/Panel.jsx";
import { Textarea } from "../../../Pocket Design System/components/forms/Textarea.jsx";
import { Badge } from "../../../Pocket Design System/components/core/Badge.jsx";
import { CopyButton } from "../../../Pocket Design System/components/core/CopyButton.jsx";
import { IconButton } from "../../../Pocket Design System/components/core/IconButton.jsx";
import { Button } from "../../../Pocket Design System/components/core/Button.jsx";
import { SegmentedControl } from "../../../Pocket Design System/components/forms/SegmentedControl.jsx";
import { useSplitView } from "../../split-view.jsx";

export default function Base64Screen() {
  const [input, setInput] = React.useState("");
  const [mode, setMode] = React.useState("Encode");
  const sv = useSplitView("Input", "Output");

  const output = React.useMemo(() => {
    if (!input) return "";
    try {
      if (mode === "Encode") {
        return btoa(unescape(encodeURIComponent(input)));
      } else {
        return decodeURIComponent(escape(atob(input)));
      }
    } catch (e) {
      return "Error: " + (e.message || "Invalid Base64 string");
    }
  }, [input, mode]);

  const hasError = output.startsWith("Error: ");
  const displayOutput = hasError ? output.substring(7) : output;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <SegmentedControl options={["Encode", "Decode"]} value={mode} onChange={setMode} />
        {sv.control}
        <span style={{ marginLeft: "auto" }}>
          <Button variant="ghost" size="sm" icon="rotate-ccw" onClick={() => setInput(mode === "Encode" ? "Pocket is awesome" : "UG9ja2V0IGlzIGF3ZXNvbWU=")}>Sample</Button>
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: sv.columns, gap: 14 }}>
        <Panel style={sv.leftStyle} title="Input" variant="sunken" meta={input.length.toLocaleString() + " chars"}
          actions={<IconButton icon="x" label="Clear" size="sm" onClick={() => setInput("")} />}>
          <Textarea bare value={input} onChange={(e) => setInput(e.target.value)}
            placeholder={mode === "Encode" ? "Type text to encode..." : "Paste Base64 to decode..."} style={{ flex: 1, padding: "12px 14px", minHeight: 0 }} />
        </Panel>
        <Panel style={sv.rightStyle} title="Output" variant="code"
          meta={hasError ? <Badge kind="danger">Decode error</Badge> : input.trim() ? <Badge kind="ok" dot>{mode === "Encode" ? "Encoded" : "Decoded"}</Badge> : null}
          actions={<CopyButton onDark getText={() => displayOutput} />}>
          {hasError ? (
            <div style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.6, color: "#E08A76" }}>{displayOutput}</div>
          ) : (
            <pre style={{ margin: 0, padding: "12px 16px", overflow: "auto", flex: 1, fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.6, color: "var(--code-fg)", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{displayOutput}</pre>
          )}
        </Panel>
      </div>
    </div>
  );
}
