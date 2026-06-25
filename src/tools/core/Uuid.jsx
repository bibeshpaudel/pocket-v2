import React from "react";
import { Panel } from "../../../Pocket Design System/components/surfaces/Panel.jsx";
import { Badge } from "../../../Pocket Design System/components/core/Badge.jsx";
import { CopyButton } from "../../../Pocket Design System/components/core/CopyButton.jsx";
import { Button } from "../../../Pocket Design System/components/core/Button.jsx";
import { Select } from "../../../Pocket Design System/components/forms/Select.jsx";
import { Switch } from "../../../Pocket Design System/components/forms/Switch.jsx";
import { SegmentedControl } from "../../../Pocket Design System/components/forms/SegmentedControl.jsx";

function uuidv1() {
  const now = Date.now();
  const timeHex = now.toString(16).padStart(16, "0");
  const timeLow = timeHex.substring(8, 16);
  const timeMid = timeHex.substring(4, 8);
  const timeHi = "1" + timeHex.substring(1, 4);

  const clockSeq = Math.floor(Math.random() * 0x3fff).toString(16).padStart(4, "0");
  const node = Array.from({ length: 6 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0")).join("");

  return `${timeLow}-${timeMid}-${timeHi}-${clockSeq}-${node}`;
}

function uuidv4() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function uuidv7() {
  const timestamp = Date.now();
  const arr = new Uint32Array(3);
  crypto.getRandomValues(arr);

  const randA = arr[0] & 0x0fff; // 12 bits
  const randB = arr[1] & 0x3fffffff; // 30 bits
  const randC = arr[2]; // 32 bits

  const timeHex = timestamp.toString(16).padStart(12, "0");
  const verAndRandA = "7" + randA.toString(16).padStart(3, "0");
  const variantAndRandB = ((randB & 0x3fff) | 0x8000).toString(16);
  const randPart = ((randB >> 14) ^ randC).toString(16).padStart(12, "0").substring(0, 12);

  const part1 = timeHex.substring(0, 8);
  const part2 = timeHex.substring(8, 12);
  const part3 = verAndRandA;
  const part4 = variantAndRandB;
  const part5 = randPart;

  return `${part1}-${part2}-${part3}-${part4}-${part5}`;
}

export default function UuidScreen() {
  const [version, setVersion] = React.useState("v4 (Random)");
  const [count, setCount] = React.useState("5");
  const [uppercase, setUppercase] = React.useState(false);
  const [output, setOutput] = React.useState("");

  const handleGenerate = () => {
    const num = Number(count);
    const list = [];
    for (let i = 0; i < num; i++) {
      let id;
      if (version.startsWith("v4")) {
        id = uuidv4();
      } else if (version.startsWith("v7")) {
        id = uuidv7();
      } else {
        id = uuidv1();
      }
      list.push(uppercase ? id.toUpperCase() : id.toLowerCase());
    }
    setOutput(list.join("\n"));
  };

  React.useEffect(() => {
    handleGenerate();
  }, [version, count, uppercase]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .uuid-version-picker .pkt-seg {
          padding: 4px;
        }
        .uuid-version-picker .pkt-seg__opt {
          height: 34px;
          padding: 0 16px;
          font-size: 13px;
          border-radius: var(--radius-md);
        }
        .uuid-version-picker .pkt-seg__opt--on {
          height: 34px;
        }
      ` }} />
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Panel title="Configuration" variant="sunken">
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "var(--tracking-caps)" }}>UUID Version</span>
              <div className="uuid-version-picker">
                <SegmentedControl options={["v4 (Random)", "v7 (Epoch)", "v1 (Time)"]} value={version} onChange={setVersion} />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "var(--tracking-caps)" }}>Quantity</span>
              <Select
                options={["1", "5", "10", "20", "50", "100"].map(c => ({ value: c, label: c }))}
                value={count} onChange={e => setCount(e.target.value)} style={{ maxWidth: 120 }} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Switch checked={uppercase} onChange={setUppercase} label="Uppercase output" />
            </div>

            <div style={{ marginTop: 10 }}>
              <Button size="md" icon="refresh-cw" onClick={handleGenerate}>Regenerate</Button>
            </div>
          </div>
        </Panel>

        <Panel title="UUIDs" variant="code"
          meta={<Badge kind="neutral">{count} UUIDs</Badge>}
          actions={<CopyButton onDark getText={() => output} />}>
          <pre style={{ margin: 0, padding: "14px 16px", overflow: "auto", flex: 1, fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.6, color: "var(--code-fg)" }}>
            {output}
          </pre>
        </Panel>
      </div>
    </div>
  );
}
