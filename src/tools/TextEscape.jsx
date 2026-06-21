// Pocket — Escape / Unescape. HTML entities, JSON-string, and Unicode (\uXXXX)
// escaping in both directions. Pure client-side. DS + tokens.
import React from "react";
import { SegmentedControl } from "../../Pocket Design System/components/forms/SegmentedControl.jsx";
import { ConvertPanels } from "./convert-panels.jsx";
import {
  escapeHTML, unescapeHTML, escapeJSONString, unescapeJSONString, escapeUnicode, unescapeUnicode,
} from "./text-convert.js";

const MODES = {
  html: { label: "HTML entities", esc: escapeHTML, unesc: unescapeHTML, sample: 'Tom & Jerry <3 "quotes"' },
  json: { label: "JSON string", esc: escapeJSONString, unesc: unescapeJSONString, sample: 'line one\nline "two"\ttabbed' },
  unicode: { label: "Unicode", esc: escapeUnicode, unesc: unescapeUnicode, sample: "café — naïve — 日本語" },
};

export default function TextEscapeScreen() {
  const [mode, setMode] = React.useState("html");
  const [dir, setDir] = React.useState("escape");
  const [text, setText] = React.useState(MODES.html.sample);

  const { output, error } = React.useMemo(() => {
    if (!text) return { output: "", error: null };
    try {
      const fn = dir === "escape" ? MODES[mode].esc : MODES[mode].unesc;
      return { output: fn(text), error: null };
    } catch (e) {
      return { output: "", error: (e && e.message) || "Could not convert" };
    }
  }, [text, mode, dir]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <SegmentedControl options={Object.entries(MODES).map(([value, m]) => ({ value, label: m.label }))} value={mode} onChange={setMode} />
        <SegmentedControl options={[{ value: "escape", label: "Escape" }, { value: "unescape", label: "Unescape" }]} value={dir} onChange={setDir} />
      </div>
      <ConvertPanels
        inputTitle={dir === "escape" ? "Plain" : "Escaped"} outputTitle={dir === "escape" ? "Escaped" : "Plain"}
        value={text} onChange={setText} output={output} error={error} okLabel="Done"
        placeholder={MODES[mode].sample} />
    </div>
  );
}
