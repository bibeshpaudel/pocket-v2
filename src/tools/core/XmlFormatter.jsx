import React from "react";
import { Panel } from "../../../Pocket Design System/components/surfaces/Panel.jsx";
import { Textarea } from "../../../Pocket Design System/components/forms/Textarea.jsx";
import { Badge } from "../../../Pocket Design System/components/core/Badge.jsx";
import { CopyButton } from "../../../Pocket Design System/components/core/CopyButton.jsx";
import { IconButton } from "../../../Pocket Design System/components/core/IconButton.jsx";
import { Button } from "../../../Pocket Design System/components/core/Button.jsx";
import { Select } from "../../../Pocket Design System/components/forms/Select.jsx";
import { SegmentedControl } from "../../../Pocket Design System/components/forms/SegmentedControl.jsx";
import { pocketHighlightXML } from "../../tools-data.js";
import { useSplitView } from "../../split-view.jsx";
import { XmlTree } from "../tree-view.jsx";
import { CodeWithLines } from "../code-output.jsx";

const SAMPLE_XML = '<?xml version="1.0" encoding="UTF-8"?>\n<pocket>\n  <name>pocket</name>\n  <tools>35</tools>\n  <client_side>true</client_side>\n  <categories>\n    <category>formatters</category>\n    <category>generators</category>\n    <category>converters</category>\n  </categories>\n  <latency_ms>0.4</latency_ms>\n</pocket>';

function formatXMLNode(node, indent = "  ", level = 0) {
  const indentStr = indent.repeat(level);

  if (node.nodeType === 3) { // TEXT_NODE
    const text = node.nodeValue.trim();
    return text ? indentStr + text + "\n" : "";
  }
  if (node.nodeType === 8) { // COMMENT_NODE
    return indentStr + `<!--${node.nodeValue}-->\n`;
  }
  if (node.nodeType === 4) { // CDATA_SECTION_NODE
    return indentStr + `<![CDATA[${node.nodeValue}]]>\n`;
  }
  if (node.nodeType === 7) { // PROCESSING_INSTRUCTION_NODE
    return indentStr + `<?${node.target} ${node.data}?>\n`;
  }
  if (node.nodeType === 1) { // ELEMENT_NODE
    let xml = indentStr + "<" + node.nodeName;
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      xml += ` ${attr.name}="${attr.value}"`;
    }

    if (node.childNodes.length === 0) {
      return xml + " />\n";
    }

    // Check if it's only text
    const onlyText = Array.from(node.childNodes).every(c => c.nodeType === 3);
    if (onlyText) {
      const text = node.textContent.trim();
      return xml + ">" + text + "</" + node.nodeName + ">\n";
    }

    xml += ">\n";
    for (let i = 0; i < node.childNodes.length; i++) {
      xml += formatXMLNode(node.childNodes[i], indent, level + 1);
    }
    xml += indentStr + "</" + node.nodeName + ">\n";
    return xml;
  }
  if (node.nodeType === 9) { // DOCUMENT_NODE
    let xml = "";
    for (let i = 0; i < node.childNodes.length; i++) {
      xml += formatXMLNode(node.childNodes[i], indent, level);
    }
    return xml.trim() + "\n";
  }
  return "";
}

function minifyXMLNode(node) {
  if (node.nodeType === 3) { // TEXT_NODE
    return node.nodeValue.trim();
  }
  if (node.nodeType === 8) { // COMMENT_NODE
    return ""; // Strip comments in minify mode
  }
  if (node.nodeType === 4) { // CDATA_SECTION_NODE
    return `<![CDATA[${node.nodeValue}]]>`;
  }
  if (node.nodeType === 7) { // PROCESSING_INSTRUCTION_NODE
    return `<?${node.target} ${node.data}?>`;
  }
  if (node.nodeType === 1) { // ELEMENT_NODE
    let xml = "<" + node.nodeName;
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      xml += ` ${attr.name}="${attr.value}"`;
    }
    if (node.childNodes.length === 0) {
      return xml + " />";
    }
    xml += ">";
    for (let i = 0; i < node.childNodes.length; i++) {
      xml += minifyXMLNode(node.childNodes[i]);
    }
    xml += "</" + node.nodeName + ">";
    return xml;
  }
  if (node.nodeType === 9) { // DOCUMENT_NODE
    let xml = "";
    for (let i = 0; i < node.childNodes.length; i++) {
      xml += minifyXMLNode(node.childNodes[i]);
    }
    return xml;
  }
  return "";
}

// Tolerant XML pretty-printer used when the strict DOMParser rejects the input
// (e.g. unclosed tags). It re-indents the *exact* tokens the user typed — it
// never invents or drops tags — using a tag stack: a closing tag dedents to its
// matching open (popping any unclosed tags in between), so malformed XML still
// formats readably instead of failing outright.
function formatXMLLenient(src, indentUnit) {
  const tokenRe = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<!DOCTYPE[\s\S]*?>|<\?[\s\S]*?\?>|<\/[^>]*>|<[^>]*>|[^<]+/g;
  const tokens = src.match(tokenRe) || [];
  const isOpen = (t) => /^</.test(t);
  const isClose = (t) => /^<\//.test(t.trim());
  const tagName = (t) => {
    const m = t.match(/^<\/?\s*([^\s/>]+)/);
    return m ? m[1] : "";
  };
  const stack = [];
  const out = [];
  const pad = (n) => indentUnit.repeat(Math.max(0, n));

  for (let i = 0; i < tokens.length; i++) {
    const raw = tokens[i];
    if (!isOpen(raw)) {                           // text node
      const text = raw.trim();
      if (text) out.push(pad(stack.length) + text);
      continue;
    }
    const tok = raw.trim();
    if (isClose(tok)) {                            // closing tag — dedent to its open
      const idx = stack.lastIndexOf(tagName(tok));
      if (idx !== -1) stack.length = idx;          // drop any unclosed tags in between
      out.push(pad(stack.length) + tok);
    } else if (/\/>$/.test(tok) || /^<[!?]/.test(tok)) {  // self-close / decl / comment / doctype / cdata
      out.push(pad(stack.length) + tok);
    } else {                                       // opening tag
      const name = tagName(tok);
      const next = tokens[i + 1], next2 = tokens[i + 2];
      // <x>text</x> and <x></x> collapse onto one line
      if (next != null && !isOpen(next) && next2 != null && isClose(next2) && tagName(next2.trim()) === name) {
        out.push(pad(stack.length) + tok + next.trim() + next2.trim());
        i += 2;
      } else if (next != null && isClose(next) && tagName(next.trim()) === name) {
        out.push(pad(stack.length) + tok + next.trim());
        i += 1;
      } else {
        out.push(pad(stack.length) + tok);
        stack.push(name);
      }
    }
  }
  return out.join("\n");
}

export default function XmlFormatterScreen() {
  const [input, setInput] = React.useState("");
  const [mode, setMode] = React.useState("Pretty");
  const [indent, setIndent] = React.useState("2");
  const [view, setView] = React.useState("Code");
  const sv = useSplitView("Input", "Output");

  // Parse state (debounced)
  const [parsedXml, setParsedXml] = React.useState(null);
  const [parseError, setParseError] = React.useState(null);

  // Handle immediate parsing for sample XML or empty state
  React.useEffect(() => {
    if (!input.trim()) {
      setParsedXml(null);
      setParseError(null);
      return;
    }

    if (input === SAMPLE_XML) {
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(input, "application/xml");
        const parserError = xmlDoc.querySelector("parsererror");
        if (parserError) {
          setParseError(parserError.textContent || "XML parse error");
          setParsedXml(null);
        } else {
          setParsedXml(xmlDoc);
          setParseError(null);
        }
      } catch (e) {
        setParseError(String(e.message || e));
        setParsedXml(null);
      }
      return;
    }

    const handler = setTimeout(() => {
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(input, "application/xml");
        const parserError = xmlDoc.querySelector("parsererror");
        if (parserError) {
          let errorText = parserError.textContent || "XML parse error";
          const lines = errorText.split("\n").map(l => l.trim()).filter(Boolean);
          if (lines.length > 0) errorText = lines[0];
          setParseError(errorText);
          setParsedXml(null);
        } else {
          setParsedXml(xmlDoc);
          setParseError(null);
        }
      } catch (e) {
        setParseError(String(e.message || e));
        setParsedXml(null);
      }
    }, 200);

    return () => clearTimeout(handler);
  }, [input]);

  // Format the parsed XML (memoized). If strict parsing failed but there's
  // input, fall back to the tolerant re-indenter so malformed XML still formats.
  const output = React.useMemo(() => {
    const indentChar = indent === "tab" ? "\t" : " ".repeat(Number(indent));
    if (parseError) {
      return input.trim() ? formatXMLLenient(input, mode === "Minify" ? "" : indentChar) : "";
    }
    if (!parsedXml) return "";
    return mode === "Minify" ? minifyXMLNode(parsedXml) : formatXMLNode(parsedXml, indentChar, 0);
  }, [parsedXml, parseError, mode, indent, input]);

  const outputHtml = React.useMemo(() => {
    if (!output) return "";
    return pocketHighlightXML(output);
  }, [output]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <SegmentedControl options={["Pretty", "Minify"]} value={mode} onChange={setMode} />
        <Select options={[{ value: "2", label: "2 spaces" }, { value: "4", label: "4 spaces" }, { value: "tab", label: "Tabs" }]}
          value={indent} onChange={(e) => setIndent(e.target.value)} disabled={mode === "Minify"} />
        <SegmentedControl options={["Code", "Tree"]} value={view} onChange={setView} />
        {sv.control}
        <span style={{ marginLeft: "auto" }}>
          <Button variant="ghost" size="sm" icon="rotate-ccw" onClick={() => setInput(SAMPLE_XML)}>Sample</Button>
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: sv.columns, gap: 14 }}>
        <Panel style={sv.leftStyle} title="Input" variant="sunken" meta={input.length.toLocaleString() + " chars"}
          actions={<IconButton icon="x" label="Clear" size="sm" onClick={() => setInput("")} />}>
          <Textarea bare value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Paste XML here…" style={{ flex: 1, padding: "12px 14px", minHeight: 0 }} />
        </Panel>
        <Panel style={sv.rightStyle} title="Output" variant="code"
          meta={!input.trim() ? null : parseError ? <Badge kind="warn" dot>Not well-formed</Badge> : <Badge kind="ok" dot>Valid XML</Badge>}
          actions={<CopyButton onDark getText={() => output} />}>
          {!input.trim() ? null
            : view === "Tree" && parsedXml != null ? (
              <XmlTree doc={parsedXml} />
            ) : (
              <CodeWithLines text={output} html={outputHtml} />
            )}
        </Panel>
      </div>
    </div>
  );
}
