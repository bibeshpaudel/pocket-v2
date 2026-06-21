// Pocket — .env ↔ JSON. Parse dotenv files (comments, quotes, `export` prefix)
// into JSON and back. Pure client-side. DS + tokens.
import React from "react";
import { SegmentedControl } from "../../Pocket Design System/components/forms/SegmentedControl.jsx";
import { ConvertPanels } from "./convert-panels.jsx";
import { parseEnv, objectToEnv } from "./text-convert.js";

const SAMPLE_ENV = "# database\nexport DB_HOST=localhost\nDB_PORT=5432\nAPI_KEY=\"a b c\"\nDEBUG=true";

export default function EnvJsonScreen() {
  const [dir, setDir] = React.useState("env2json");
  const [text, setText] = React.useState(SAMPLE_ENV);

  const { output, error } = React.useMemo(() => {
    if (!text.trim()) return { output: "", error: null };
    try {
      if (dir === "env2json") return { output: JSON.stringify(parseEnv(text), null, 2), error: null };
      const data = JSON.parse(text);
      if (data === null || typeof data !== "object" || Array.isArray(data)) {
        return { output: "", error: "Expected a JSON object of key/value pairs." };
      }
      return { output: objectToEnv(data), error: null };
    } catch (e) {
      return { output: "", error: (e && e.message) || "Conversion failed" };
    }
  }, [text, dir]);

  const env = dir === "env2json";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <SegmentedControl options={[{ value: "env2json", label: ".env → JSON" }, { value: "json2env", label: "JSON → .env" }]} value={dir} onChange={setDir} />
      </div>
      <ConvertPanels
        inputTitle={env ? ".env" : "JSON"} outputTitle={env ? "JSON" : ".env"}
        value={text} onChange={setText} output={output} error={error} okLabel="Converted"
        placeholder={env ? SAMPLE_ENV : '{\n  "DB_HOST": "localhost",\n  "DEBUG": "true"\n}'} />
    </div>
  );
}
