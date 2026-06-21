// Pocket — Slugify. Turn text/titles into URL-safe slugs. Strips diacritics,
// collapses separators, optional casing. Pure client-side. DS + tokens.
import React from "react";
import { SegmentedControl } from "../../Pocket Design System/components/forms/SegmentedControl.jsx";
import { Switch } from "../../Pocket Design System/components/forms/Switch.jsx";
import { ConvertPanels } from "./convert-panels.jsx";
import { slugify } from "./text-convert.js";

export default function SlugifyScreen() {
  const [text, setText] = React.useState("Crème Brûlée — 10 Best Recipes!");
  const [separator, setSeparator] = React.useState("-");
  const [lower, setLower] = React.useState(true);

  const output = React.useMemo(() => {
    if (!text) return "";
    // Slug each line independently so a list of titles maps to a list of slugs.
    return text.split(/\r?\n/).map((line) => slugify(line, { separator, lower })).join("\n");
  }, [text, separator, lower]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Separator</span>
        <SegmentedControl options={[{ value: "-", label: "Hyphen -" }, { value: "_", label: "Underscore _" }, { value: "", label: "None" }]} value={separator} onChange={setSeparator} mono />
        <Switch checked={lower} onChange={setLower} label="lowercase" />
      </div>
      <ConvertPanels
        inputTitle="Text" outputTitle="Slug"
        value={text} onChange={setText} output={output} okLabel="Slugified"
        placeholder={"My Great Article Title\nAnother Title Here"} />
    </div>
  );
}
