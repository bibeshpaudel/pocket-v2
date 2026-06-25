import React from "react";
import { Panel } from "../../../Pocket Design System/components/surfaces/Panel.jsx";
import { Textarea } from "../../../Pocket Design System/components/forms/Textarea.jsx";
import { Badge } from "../../../Pocket Design System/components/core/Badge.jsx";
import { CopyButton } from "../../../Pocket Design System/components/core/CopyButton.jsx";
import { IconButton } from "../../../Pocket Design System/components/core/IconButton.jsx";
import { Button } from "../../../Pocket Design System/components/core/Button.jsx";
import { Select } from "../../../Pocket Design System/components/forms/Select.jsx";
import { Switch } from "../../../Pocket Design System/components/forms/Switch.jsx";
import { SegmentedControl } from "../../../Pocket Design System/components/forms/SegmentedControl.jsx";
import { pocketHighlightJSON } from "../../tools-data.js";
import { useSplitView } from "../../split-view.jsx";
import { JsonTree } from "../tree-view.jsx";
import { CodeWithLines } from "../code-output.jsx";

const SAMPLE_JSON = '{"name":"pocket","tools":35,"client_side":true,"categories":["formatters","generators","converters"],"latency_ms":0.4}';

function sortDeep(v) {
  if (Array.isArray(v)) return v.map(sortDeep);
  if (v && typeof v === "object") {
    const out = {};
    Object.keys(v).sort().forEach((k) => { out[k] = sortDeep(v[k]); });
    return out;
  }
  return v;
}

export default function JsonFormatterScreen() {
  const [input, setInput] = React.useState("");
  const [mode, setMode] = React.useState("Pretty");
  const [indent, setIndent] = React.useState("2");
  const [sortKeys, setSortKeys] = React.useState(false);
  const [view, setView] = React.useState("Code");
  const sv = useSplitView("Input", "Output");

  // Parse state (debounced)
  const [parsedJson, setParsedJson] = React.useState(null);
  const [parseError, setParseError] = React.useState(null);

  // Handle immediate parsing for sample JSON or empty state
  React.useEffect(() => {
    if (!input.trim()) {
      setParsedJson(null);
      setParseError(null);
      return;
    }

    // If it's the sample JSON, we parse immediately to avoid flash
    if (input === SAMPLE_JSON) {
      try {
        const parsed = JSON.parse(input);
        setParsedJson(parsed);
        setParseError(null);
      } catch (e) {
        setParseError(String(e.message || e));
      }
      return;
    }

    const handler = setTimeout(() => {
      try {
        const parsed = JSON.parse(input);
        setParsedJson(parsed);
        setParseError(null);
      } catch (e) {
        setParseError(String(e.message || e));
      }
    }, 200);

    return () => clearTimeout(handler);
  }, [input]);

  // Format the parsed data (memoized)
  const output = React.useMemo(() => {
    if (parseError || !parsedJson) return "";
    let data = parsedJson;
    if (sortKeys) data = sortDeep(data);
    return mode === "Minify"
      ? JSON.stringify(data)
      : JSON.stringify(data, null, indent === "tab" ? "\t" : Number(indent));
  }, [parsedJson, parseError, mode, indent, sortKeys]);

  const outputHtml = React.useMemo(() => {
    if (!output) return "";
    return pocketHighlightJSON(output);
  }, [output]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <SegmentedControl options={["Pretty", "Minify"]} value={mode} onChange={setMode} />
        <Select options={[{ value: "2", label: "2 spaces" }, { value: "4", label: "4 spaces" }, { value: "tab", label: "Tabs" }]}
          value={indent} onChange={(e) => setIndent(e.target.value)} disabled={mode === "Minify"} />
        <Switch checked={sortKeys} onChange={setSortKeys} label="Sort keys" />
        <SegmentedControl options={["Code", "Tree"]} value={view} onChange={setView} />
        {sv.control}
        <span style={{ marginLeft: "auto" }}>
          <Button variant="ghost" size="sm" icon="rotate-ccw" onClick={() => setInput(SAMPLE_JSON)}>Sample</Button>
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: sv.columns, gap: 14 }}>
        <Panel style={sv.leftStyle} title="Input" variant="sunken" meta={input.length.toLocaleString() + " chars"}
          actions={<IconButton icon="x" label="Clear" size="sm" onClick={() => setInput("")} />}>
          <Textarea bare value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Paste JSON here…" style={{ flex: 1, padding: "12px 14px", minHeight: 0 }} />
        </Panel>
        <Panel style={sv.rightStyle} title="Output" variant="code"
          meta={parseError ? <Badge kind="danger">Parse error</Badge> : input.trim() ? <Badge kind="ok" dot>Valid JSON</Badge> : null}
          actions={<CopyButton onDark getText={() => output} />}>
          {parseError ? (
            <div style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.6, color: "#E08A76" }}>{parseError}</div>
          ) : view === "Tree" && parsedJson != null ? (
            <JsonTree data={sortKeys ? sortDeep(parsedJson) : parsedJson} />
          ) : (
            <CodeWithLines text={output} html={outputHtml} />
          )}
        </Panel>
      </div>
    </div>
  );
}
