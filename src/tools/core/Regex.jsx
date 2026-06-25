import React from "react";
import { Panel } from "../../../Pocket Design System/components/surfaces/Panel.jsx";
import { Textarea } from "../../../Pocket Design System/components/forms/Textarea.jsx";
import { Badge } from "../../../Pocket Design System/components/core/Badge.jsx";
import { IconButton } from "../../../Pocket Design System/components/core/IconButton.jsx";
import { Switch } from "../../../Pocket Design System/components/forms/Switch.jsx";
import { SegmentedControl } from "../../../Pocket Design System/components/forms/SegmentedControl.jsx";

export default function RegexScreen() {
  const [pattern, setPattern] = React.useState("[a-zA-Z]+");
  const [flags, setFlags] = React.useState({ g: true, i: true, m: false, s: false });
  const [testString, setTestString] = React.useState("The quick brown fox jumps over 42 lazy dogs.");
  const [viewMode, setViewMode] = React.useState("Highlight");

  const flagsStr = Object.entries(flags)
    .filter(([_, enabled]) => enabled)
    .map(([flag]) => flag)
    .join("");

  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const result = React.useMemo(() => {
    if (!pattern) return { matches: [], html: esc(testString), error: null };
    try {
      const re = new RegExp(pattern, flagsStr);
      // Construct a clone with global flag for finding all matches for highlighting
      const hasGlobal = flags.g;
      const reClone = new RegExp(pattern, hasGlobal ? flagsStr : flagsStr + "g");

      let matches = [];
      let match;
      let lastIndex = 0;
      let htmlParts = [];

      let safetyIndex = 0;
      while ((match = reClone.exec(testString)) !== null) {
        if (match.index === reClone.lastIndex) {
          reClone.lastIndex++;
        }
        matches.push({
          value: match[0],
          index: match.index,
          length: match[0].length,
          groups: match.slice(1)
        });

        htmlParts.push(esc(testString.substring(lastIndex, match.index)));
        htmlParts.push(`<span style="background: rgba(245, 158, 11, 0.22); border-bottom: 2px solid var(--amber-500); color: inherit; padding: 1px 2px; border-radius: 2px;">${esc(match[0])}</span>`);
        lastIndex = reClone.lastIndex;

        safetyIndex++;
        if (safetyIndex > 2000) break; // infinite loop protection
      }
      htmlParts.push(esc(testString.substring(lastIndex)));

      const finalMatches = hasGlobal ? matches : matches.slice(0, 1);
      return { matches: finalMatches, html: htmlParts.join(""), error: null };
    } catch (e) {
      return { matches: [], html: "", error: e.message };
    }
  }, [pattern, flagsStr, testString]);

  const toggleFlag = (flag) => {
    setFlags(f => ({ ...f, [flag]: !f[flag] }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      {/* Top Configuration */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", background: "var(--surface-raised)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", padding: "10px 14px" }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>Regex</span>
        <div style={{ display: "flex", alignItems: "center", gap: 2, background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "0 10px", flex: 1, minWidth: 240, maxWidth: 480 }}>
          <span style={{ fontSize: 16, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", userSelect: "none" }}>/</span>
          <input
            type="text"
            value={pattern}
            onChange={e => setPattern(e.target.value)}
            placeholder="pattern"
            style={{
              flex: 1, height: 32, border: "none", background: "transparent", outline: "none",
              color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontSize: 14
            }}
          />
          <span style={{ fontSize: 16, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", userSelect: "none" }}>/{flagsStr}</span>
        </div>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <Switch checked={flags.g} onChange={() => toggleFlag("g")} label="Global (g)" />
          <Switch checked={flags.i} onChange={() => toggleFlag("i")} label="Case Insensitive (i)" />
          <Switch checked={flags.m} onChange={() => toggleFlag("m")} label="Multiline (m)" />
          <Switch checked={flags.s} onChange={() => toggleFlag("s")} label="DotAll (s)" />
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Panel title="Test String" variant="sunken"
          actions={<IconButton icon="x" label="Clear" size="sm" onClick={() => setTestString("")} />}>
          <Textarea bare value={testString} onChange={(e) => setTestString(e.target.value)}
            placeholder="Type test text here..." style={{ flex: 1, padding: "12px 14px", minHeight: 0 }} />
        </Panel>

        <Panel title="Matches" variant="code"
          meta={
            result.error ? (
              <Badge kind="danger">Invalid regex</Badge>
            ) : (
              <Badge kind={result.matches.length > 0 ? "ok" : "neutral"}>{result.matches.length} matches</Badge>
            )
          }
          actions={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <SegmentedControl options={["Highlight", "Matches List"]} value={viewMode} onChange={setViewMode} />
            </div>
          }>

          {result.error ? (
            <div style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: 13, color: "#E08A76" }}>{result.error}</div>
          ) : viewMode === "Highlight" ? (
            <pre
              style={{ margin: 0, padding: "14px 16px", overflow: "auto", flex: 1, fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.6, color: "var(--code-fg)", whiteSpace: "pre-wrap", wordBreak: "break-all" }}
              dangerouslySetInnerHTML={{ __html: result.html || esc(testString) }}
            />
          ) : (
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", flex: 1 }}>
              {result.matches.length > 0 ? (
                result.matches.map((m, idx) => (
                  <div key={idx} style={{ background: "rgba(0,0,0,0.15)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-tertiary)" }}>
                      <span>Match #{idx + 1}</span>
                      <span>Index: {m.index}..{m.index + m.length}</span>
                    </div>
                    <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--code-fg)", wordBreak: "break-all" }}>{m.value}</code>
                    {m.groups.length > 0 && (
                      <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: "var(--syn-comment)" }}>Groups</span>
                        {m.groups.map((g, gIdx) => (
                          <div key={gIdx} style={{ display: "flex", gap: 8, fontSize: 11, fontFamily: "var(--font-mono)" }}>
                            <span style={{ color: "var(--text-tertiary)" }}>Group {gIdx + 1}:</span>
                            <span style={{ color: "var(--amber-500)" }}>{g !== undefined ? `"${g}"` : "undefined"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", fontSize: 13 }}>No matches found.</div>
              )}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
