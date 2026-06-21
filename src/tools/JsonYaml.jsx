// Pocket — JSON ↔ YAML. Both directions, fully client-side via js-yaml (bundled
// into this lazy chunk, so it only loads when the tool opens). DS + tokens.
import React from "react";
import { load as yamlLoad, dump as yamlDump } from "js-yaml";
import { SegmentedControl } from "../../Pocket Design System/components/forms/SegmentedControl.jsx";
import { ConvertPanels } from "./convert-panels.jsx";

const SAMPLE = '{\n  "name": "Pocket",\n  "tags": ["fast", "local"],\n  "nested": { "ok": true }\n}';

export default function JsonYamlScreen() {
  const [dir, setDir] = React.useState("json2yaml");
  const [text, setText] = React.useState(SAMPLE);

  const { output, error } = React.useMemo(() => {
    const src = text.trim();
    if (!src) return { output: "", error: null };
    try {
      if (dir === "json2yaml") {
        return { output: yamlDump(JSON.parse(text), { indent: 2, lineWidth: -1, noRefs: true }), error: null };
      }
      const data = yamlLoad(text);
      return { output: JSON.stringify(data === undefined ? null : data, null, 2), error: null };
    } catch (e) {
      return { output: "", error: (e && e.message) || "Conversion failed" };
    }
  }, [text, dir]);

  const json = dir === "json2yaml";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <SegmentedControl options={[{ value: "json2yaml", label: "JSON → YAML" }, { value: "yaml2json", label: "YAML → JSON" }]} value={dir} onChange={setDir} />
      </div>
      <ConvertPanels
        inputTitle={json ? "JSON" : "YAML"} outputTitle={json ? "YAML" : "JSON"}
        value={text} onChange={setText} output={output} error={error}
        okLabel="Converted"
        placeholder={json ? SAMPLE : "name: Pocket\ntags:\n  - fast\n  - local"} />
    </div>
  );
}
