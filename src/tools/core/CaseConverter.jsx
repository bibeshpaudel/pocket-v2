import React from "react";
import { Panel } from "../../../Pocket Design System/components/surfaces/Panel.jsx";
import { Textarea } from "../../../Pocket Design System/components/forms/Textarea.jsx";
import { CopyButton } from "../../../Pocket Design System/components/core/CopyButton.jsx";
import { IconButton } from "../../../Pocket Design System/components/core/IconButton.jsx";
import { useSplitView } from "../../split-view.jsx";

export default function CaseConverterScreen() {
  const [input, setInput] = React.useState("The quick brown fox jumps over the lazy dog");
  const sv = useSplitView("Input", "Conversions");

  const getWords = (str) => {
    return str
      .replace(/([a-z])([A-Z])/g, "$1 $2") // Split camelCase
      .replace(/[^a-zA-Z0-9]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  };

  const results = React.useMemo(() => {
    if (!input) return {
      upper: "", lower: "", camel: "", pascal: "", snake: "", kebab: "", sentence: "", title: ""
    };

    const words = getWords(input);
    const upper = input.toUpperCase();
    const lower = input.toLowerCase();

    const camel = words.map((w, i) =>
      i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    ).join("");

    const pascal = words.map(w =>
      w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    ).join("");

    const snake = words.map(w => w.toLowerCase()).join("_");
    const kebab = words.map(w => w.toLowerCase()).join("-");

    const sentence = input.toLowerCase().replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());

    const title = input.replace(/\b\w/g, c => c.toUpperCase());

    return { upper, lower, camel, pascal, snake, kebab, sentence, title };
  }, [input]);

  const formats = [
    { id: "lower", label: "lower case", value: results.lower },
    { id: "upper", label: "UPPER CASE", value: results.upper },
    { id: "sentence", label: "Sentence case", value: results.sentence },
    { id: "title", label: "Title Case", value: results.title },
    { id: "camel", label: "camelCase", value: results.camel },
    { id: "pascal", label: "PascalCase", value: results.pascal },
    { id: "snake", label: "snake_case", value: results.snake },
    { id: "kebab", label: "kebab-case", value: results.kebab }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {sv.control}
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: sv.columns, gap: 14 }}>
        <Panel style={sv.leftStyle} title="Input Text" variant="sunken" meta={input.length.toLocaleString() + " chars"}
          actions={<IconButton icon="x" label="Clear" size="sm" onClick={() => setInput("")} />}>
          <Textarea bare value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Type or paste text to convert..." style={{ flex: 1, padding: "12px 14px", minHeight: 0 }} />
        </Panel>

        <Panel style={sv.rightStyle} title="Conversions" variant="code">
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", flex: 1 }}>
            {formats.map(fmt => (
              <div key={fmt.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--syn-comment)", letterSpacing: "var(--tracking-caps)" }}>{fmt.label}</span>
                  {fmt.value && <CopyButton onDark size="sm" getText={() => fmt.value} />}
                </div>
                <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: fmt.value ? "var(--code-fg)" : "var(--text-tertiary)", wordBreak: "break-all", background: "rgba(0,0,0,0.2)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>
                  {fmt.value || "—"}
                </code>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
