import React from "react";
import { Panel } from "../../../Pocket Design System/components/surfaces/Panel.jsx";
import { Textarea } from "../../../Pocket Design System/components/forms/Textarea.jsx";
import { Badge } from "../../../Pocket Design System/components/core/Badge.jsx";
import { CopyButton } from "../../../Pocket Design System/components/core/CopyButton.jsx";
import { IconButton } from "../../../Pocket Design System/components/core/IconButton.jsx";
import { Button } from "../../../Pocket Design System/components/core/Button.jsx";
import { SegmentedControl } from "../../../Pocket Design System/components/forms/SegmentedControl.jsx";
import { useSplitView } from "../../split-view.jsx";

const SAMPLE_ENCODE = "https://example.com/search?q=café & crème brûlée#top";
const SAMPLE_PARSE = "https://user:s3cr3t@shop.example.com:8443/catalog/men's shoes?color=blue&size=10&q=hello world#reviews";

export default function UrlCodecScreen() {
  const [mode, setMode] = React.useState("Encode");
  const [scope, setScope] = React.useState("Component");
  const [input, setInput] = React.useState(SAMPLE_ENCODE);
  const sv = useSplitView("Input", "Result");

  const result = React.useMemo(() => {
    if (!input) return { kind: "empty" };
    try {
      if (mode === "Encode") {
        return { kind: "text", value: scope === "Component" ? encodeURIComponent(input) : encodeURI(input) };
      }
      if (mode === "Decode") {
        return { kind: "text", value: scope === "Component" ? decodeURIComponent(input) : decodeURI(input) };
      }
      // Parse
      const u = new URL(input.trim());
      const parts = [
        ["origin", u.origin],
        ["protocol", u.protocol],
        ["username", u.username],
        ["password", u.password],
        ["hostname", u.hostname],
        ["port", u.port],
        ["pathname", decodeURIComponent(u.pathname)],
        ["hash", decodeURIComponent(u.hash)],
      ].filter(([, v]) => v);
      const params = [...u.searchParams.entries()];
      return { kind: "parse", parts, params };
    } catch (e) {
      return { kind: "error", value: (e && e.message) || "Invalid input" };
    }
  }, [input, mode, scope]);

  const copyText = result.kind === "text" ? result.value
    : result.kind === "parse" ? JSON.stringify({
        ...Object.fromEntries(result.parts),
        query: Object.fromEntries(result.params),
      }, null, 2)
    : "";

  const meta = result.kind === "error" ? <Badge kind="danger">{mode === "Parse" ? "Not a valid URL" : "Decode error"}</Badge>
    : result.kind === "parse" ? <Badge kind="ok" dot>{result.params.length} param{result.params.length === 1 ? "" : "s"}</Badge>
    : result.kind === "text" && input.trim() ? <Badge kind="ok" dot>{mode === "Encode" ? "Encoded" : "Decoded"}</Badge>
    : null;

  const isParse = mode === "Parse";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <SegmentedControl options={["Encode", "Decode", "Parse"]} value={mode} onChange={setMode} />
        {!isParse ? <SegmentedControl options={["Component", "Full URL"]} value={scope} onChange={setScope} mono /> : null}
        {sv.control}
        <span style={{ marginLeft: "auto" }}>
          <Button variant="ghost" size="sm" icon="rotate-ccw"
            onClick={() => setInput(isParse ? SAMPLE_PARSE : SAMPLE_ENCODE)}>Sample</Button>
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: sv.columns, gap: 14 }}>
        <Panel style={sv.leftStyle} title="Input" variant="sunken" meta={input.length.toLocaleString() + " chars"}
          actions={<IconButton icon="x" label="Clear" size="sm" onClick={() => setInput("")} />}>
          <Textarea bare value={input} onChange={(e) => setInput(e.target.value)}
            placeholder={isParse ? "Paste a full URL to break apart…" : mode === "Encode" ? "Type text to percent-encode…" : "Paste percent-encoded text to decode…"}
            style={{ flex: 1, padding: "12px 14px", minHeight: 0 }} />
        </Panel>
        <Panel style={sv.rightStyle} title="Result" variant="code" meta={meta}
          actions={copyText ? <CopyButton onDark getText={() => copyText} /> : null}>
          {result.kind === "error" ? (
            <div style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.6, color: "#E08A76" }}>{result.value}</div>
          ) : result.kind === "parse" ? (
            <div style={{ padding: "12px 16px", overflow: "auto", flex: 1, fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.7, color: "var(--code-fg)" }}>
              {result.parts.map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 12 }}>
                  <span style={{ color: "var(--syn-comment)", width: 84, flex: "none" }}>{k}</span>
                  <span style={{ wordBreak: "break-all" }}>{v}</span>
                </div>
              ))}
              {result.params.length ? (
                <>
                  <div style={{ margin: "12px 0 6px", color: "var(--syn-keyword)" }}>query parameters</div>
                  {result.params.map(([k, v], i) => (
                    <div key={i} style={{ display: "flex", gap: 12 }}>
                      <span style={{ color: "var(--syn-key)", width: 84, flex: "none", wordBreak: "break-all" }}>{k}</span>
                      <span style={{ color: "var(--syn-string)", wordBreak: "break-all" }}>{v || "—"}</span>
                    </div>
                  ))}
                </>
              ) : null}
            </div>
          ) : (
            <pre style={{ margin: 0, padding: "12px 16px", overflow: "auto", flex: 1, fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.6, color: "var(--code-fg)", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{result.value}</pre>
          )}
        </Panel>
      </div>
    </div>
  );
}
