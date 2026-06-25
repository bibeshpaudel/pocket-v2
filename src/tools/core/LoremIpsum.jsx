import React from "react";
import { Panel } from "../../../Pocket Design System/components/surfaces/Panel.jsx";
import { CopyButton } from "../../../Pocket Design System/components/core/CopyButton.jsx";
import { Button } from "../../../Pocket Design System/components/core/Button.jsx";
import { Select } from "../../../Pocket Design System/components/forms/Select.jsx";
import { Switch } from "../../../Pocket Design System/components/forms/Switch.jsx";
import { SegmentedControl } from "../../../Pocket Design System/components/forms/SegmentedControl.jsx";

const LOREM_WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
  "magna", "aliqua", "ut", "enim", "ad", "minim", "veniam", "quis", "nostrud",
  "exercitation", "ullamco", "laboris", "nisi", "ut", "aliquip", "ex", "ea",
  "commodo", "consequat", "duis", "aute", "irure", "dolor", "in", "reprehenderit",
  "in", "voluptate", "velit", "esse", "cillum", "dolore", "eu", "fugiat", "nulla",
  "pariatur", "excepteur", "sint", "occaecat", "cupidatat", "non", "proident",
  "sunt", "in", "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id", "est", "laborum"
];

function generateLoremText(type, count, startWithLorem) {
  const getRandomWord = () => LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];

  const makeSentence = (first = false) => {
    const wordCount = 5 + Math.floor(Math.random() * 10);
    const words = [];
    if (first && startWithLorem) {
      words.push("Lorem", "ipsum", "dolor", "sit", "amet");
    } else {
      words.push(getRandomWord());
      words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    }
    for (let i = words.length; i < wordCount; i++) {
      words.push(getRandomWord());
    }
    return words.join(" ") + ".";
  };

  const makeParagraph = (first = false) => {
    const sentCount = 3 + Math.floor(Math.random() * 4);
    const sentences = [];
    for (let i = 0; i < sentCount; i++) {
      sentences.push(makeSentence(first && i === 0));
    }
    return sentences.join(" ");
  };

  if (type === "Words") {
    let words = [];
    if (startWithLorem) {
      words.push("lorem", "ipsum", "dolor", "sit", "amet");
    }
    while (words.length < count) {
      words.push(getRandomWord());
    }
    if (words.length > count) words = words.slice(0, count);
    if (words.length > 0) words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    return words.join(" ");
  }

  if (type === "Sentences") {
    const sentences = [];
    for (let i = 0; i < count; i++) {
      sentences.push(makeSentence(i === 0));
    }
    return sentences.join(" ");
  }

  const paragraphs = [];
  for (let i = 0; i < count; i++) {
    paragraphs.push(makeParagraph(i === 0));
  }
  return paragraphs.join("\n\n");
}

export default function LoremIpsumScreen() {
  const [type, setType] = React.useState("Paragraphs");
  const [count, setCount] = React.useState("3");
  const [startWithLorem, setStartWithLorem] = React.useState(true);
  const [output, setOutput] = React.useState("");

  const handleGenerate = () => {
    const num = Number(count);
    setOutput(generateLoremText(type, num, startWithLorem));
  };

  React.useEffect(() => {
    handleGenerate();
  }, [type, count, startWithLorem]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Panel title="Configuration" variant="sunken">
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "var(--tracking-caps)" }}>Generate Type</span>
              <SegmentedControl options={["Paragraphs", "Sentences", "Words"]} value={type} onChange={setType} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "var(--tracking-caps)" }}>Quantity</span>
              <Select
                options={Array.from({ length: 20 }, (_, i) => ({ value: (i + 1).toString(), label: (i + 1).toString() }))}
                value={count} onChange={e => setCount(e.target.value)} style={{ maxWidth: 120 }} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Switch checked={startWithLorem} onChange={setStartWithLorem} label="Start with 'Lorem ipsum...'" />
            </div>

            <div style={{ marginTop: 10 }}>
              <Button size="md" icon="refresh-cw" onClick={handleGenerate}>Regenerate</Button>
            </div>
          </div>
        </Panel>

        <Panel title="Generated Text" variant="code" actions={<CopyButton onDark getText={() => output} />}>
          <textarea
            readOnly
            value={output}
            style={{
              flex: 1, padding: "14px 16px", border: "none", outline: "none", resize: "none",
              background: "transparent", color: "var(--code-fg)", fontFamily: "var(--font-sans)",
              fontSize: 14, lineHeight: 1.6, overflow: "auto"
            }} />
        </Panel>
      </div>
    </div>
  );
}
