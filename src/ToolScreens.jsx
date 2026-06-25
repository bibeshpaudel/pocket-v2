import React from "react";
import { Panel } from "../Pocket Design System/components/surfaces/Panel.jsx";
import { Textarea } from "../Pocket Design System/components/forms/Textarea.jsx";
import { Badge } from "../Pocket Design System/components/core/Badge.jsx";
import { CopyButton } from "../Pocket Design System/components/core/CopyButton.jsx";
import { IconButton } from "../Pocket Design System/components/core/IconButton.jsx";
import { Button } from "../Pocket Design System/components/core/Button.jsx";
import { Select } from "../Pocket Design System/components/forms/Select.jsx";
import { Switch } from "../Pocket Design System/components/forms/Switch.jsx";
import { SegmentedControl } from "../Pocket Design System/components/forms/SegmentedControl.jsx";
import { Input } from "../Pocket Design System/components/forms/Input.jsx";
import { EmptyState } from "../Pocket Design System/components/surfaces/EmptyState.jsx";
import { Icon } from "../Pocket Design System/components/core/Icon.jsx";
import { pocketHighlightJSON, pocketHighlightXML } from "./tools-data.js";
import { useSplitView } from "./split-view.jsx";
import { JsonTree, XmlTree } from "./tools/tree-view.jsx";
import md5 from "blueimp-md5";
import { sha3, blake2b, blake3 } from "hash-wasm";
import QRCode from "qrcode";

const SAMPLE_JSON = '{"name":"pocket","tools":35,"client_side":true,"categories":["formatters","generators","converters"],"latency_ms":0.4}';

function sortDeep(v) {
  if (Array.isArray(v)) return v.map(sortDeep);
  if (v && typeof v === "object") {
    const out = {};
    Object.keys(v).sort().forEach((k) => { out[k] = sortDeep(v[k]); });
    return out;
  }
  return v;
}

export function JsonFormatterScreen() {
  const [input, setInput] = React.useState("");
  const [mode, setMode] = React.useState("Pretty");
  const [indent, setIndent] = React.useState("2");
  const [sortKeys, setSortKeys] = React.useState(false);
  const [view, setView] = React.useState("Code");
  const sv = useSplitView("Input", "Output");

  // Parse state (debounced)
  const [parsedJson, setParsedJson] = React.useState(null);
  const [parseError, setParseError] = React.useState(null);

  // Handle immediate parsing for sample JSON or empty state
  React.useEffect(() => {
    if (!input.trim()) {
      setParsedJson(null);
      setParseError(null);
      return;
    }

    // If it's the sample JSON, we parse immediately to avoid flash
    if (input === SAMPLE_JSON) {
      try {
        const parsed = JSON.parse(input);
        setParsedJson(parsed);
        setParseError(null);
      } catch (e) {
        setParseError(String(e.message || e));
      }
      return;
    }

    const handler = setTimeout(() => {
      try {
        const parsed = JSON.parse(input);
        setParsedJson(parsed);
        setParseError(null);
      } catch (e) {
        setParseError(String(e.message || e));
      }
    }, 200);

    return () => clearTimeout(handler);
  }, [input]);

  // Format the parsed data (memoized)
  const output = React.useMemo(() => {
    if (parseError || !parsedJson) return "";
    let data = parsedJson;
    if (sortKeys) data = sortDeep(data);
    return mode === "Minify"
      ? JSON.stringify(data)
      : JSON.stringify(data, null, indent === "tab" ? "\t" : Number(indent));
  }, [parsedJson, parseError, mode, indent, sortKeys]);

  const outputHtml = React.useMemo(() => {
    if (!output) return "";
    return pocketHighlightJSON(output);
  }, [output]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <SegmentedControl options={["Pretty", "Minify"]} value={mode} onChange={setMode} />
        <Select options={[{ value: "2", label: "2 spaces" }, { value: "4", label: "4 spaces" }, { value: "tab", label: "Tabs" }]}
          value={indent} onChange={(e) => setIndent(e.target.value)} disabled={mode === "Minify"} />
        <Switch checked={sortKeys} onChange={setSortKeys} label="Sort keys" />
        <SegmentedControl options={["Code", "Tree"]} value={view} onChange={setView} />
        {sv.control}
        <span style={{ marginLeft: "auto" }}>
          <Button variant="ghost" size="sm" icon="rotate-ccw" onClick={() => setInput(SAMPLE_JSON)}>Sample</Button>
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: sv.columns, gap: 14 }}>
        <Panel style={sv.leftStyle} title="Input" variant="sunken" meta={input.length.toLocaleString() + " chars"}
          actions={<IconButton icon="x" label="Clear" size="sm" onClick={() => setInput("")} />}>
          <Textarea bare value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Paste JSON here…" style={{ flex: 1, padding: "12px 14px", minHeight: 0 }} />
        </Panel>
        <Panel style={sv.rightStyle} title="Output" variant="code"
          meta={parseError ? <Badge kind="danger">Parse error</Badge> : input.trim() ? <Badge kind="ok" dot>Valid JSON</Badge> : null}
          actions={<CopyButton onDark getText={() => output} />}>
          {parseError ? (
            <div style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.6, color: "#E08A76" }}>{parseError}</div>
          ) : view === "Tree" && parsedJson != null ? (
            <JsonTree data={sortKeys ? sortDeep(parsedJson) : parsedJson} />
          ) : (
            <CodeWithLines text={output} html={outputHtml} />
          )}
        </Panel>
      </div>
    </div>
  );
}

const PW_CHARS = {
  lower: "abcdefghijkmnopqrstuvwxyz",
  upper: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  numbers: "23456789",
  symbols: "!@#$%^&*-_=+?",
};

function makePassword(len, opts) {
  let pool = PW_CHARS.lower;
  if (opts.upper) pool += PW_CHARS.upper;
  if (opts.numbers) pool += PW_CHARS.numbers;
  if (opts.symbols) pool += PW_CHARS.symbols;
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => pool[n % pool.length]).join("");
}

export function PasswordScreen() {
  const [len, setLen] = React.useState(20);
  const [opts, setOpts] = React.useState({ upper: true, numbers: true, symbols: true });
  const [nonce, setNonce] = React.useState(0);
  const pw = React.useMemo(() => makePassword(len, opts), [len, opts, nonce]);
  const strength = len >= 16 && opts.symbols ? ["ok", "Strong"] : len >= 12 ? ["warn", "Okay"] : ["danger", "Weak"];
  const setOpt = (k) => (v) => setOpts((o) => ({ ...o, [k]: v }));

  return (
    <div style={{ maxWidth: 560, margin: "32px auto 0", display: "flex", flexDirection: "column", gap: 16 }}>
      <Panel variant="code" title="Password" meta={<Badge kind={strength[0]} dot>{strength[1]}</Badge>}
        actions={
          <span style={{ display: "flex", gap: 6 }}>
            <IconButton icon="refresh-cw" label="Regenerate" size="sm" onClick={() => setNonce(nonce + 1)} style={{ color: "var(--syn-punct)" }} />
            <CopyButton onDark getText={() => pw} />
          </span>
        }>
        <div style={{ padding: "20px 18px", fontFamily: "var(--font-mono)", fontSize: 19, letterSpacing: "0.02em", color: "var(--code-fg)", wordBreak: "break-all", lineHeight: 1.5 }}>{pw}</div>
      </Panel>
      <div style={{ background: "var(--surface-raised)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 500, width: 90 }}>Length</span>
          <input type="range" min="8" max="64" value={len} onChange={(e) => setLen(Number(e.target.value))}
            style={{ flex: 1, accentColor: "var(--amber-500)" }} />
          <code style={{ fontSize: 13, width: 28, textAlign: "right", color: "var(--text-secondary)" }}>{len}</code>
        </div>
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
          <Switch checked={opts.upper} onChange={setOpt("upper")} label="Uppercase" />
          <Switch checked={opts.numbers} onChange={setOpt("numbers")} label="Numbers" />
          <Switch checked={opts.symbols} onChange={setOpt("symbols")} label="Symbols" />
        </div>
        <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Generated locally with <code>crypto.getRandomValues</code>. Ambiguous characters (Il1 O0) are excluded.</div>
      </div>
    </div>
  );
}

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

// Code output with a line-number gutter (sticky on horizontal scroll). `html` is
// the syntax-highlighted markup; `text` is the plain string used for the count.
function CodeWithLines({ text, html }) {
  const count = text ? text.split("\n").length : 0;
  const gutter = Array.from({ length: count }, (_, i) => i + 1).join("\n");
  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "auto" }}>
      <pre aria-hidden="true" style={{ margin: 0, padding: "12px 12px 12px 16px", position: "sticky", left: 0,
        background: "var(--code-bg)", color: "var(--syn-comment)", textAlign: "right", userSelect: "none",
        fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.6, flexShrink: 0,
        borderRight: "1px solid var(--border-subtle)" }}>{gutter}</pre>
      <pre style={{ margin: 0, padding: "12px 16px", flex: 1, fontFamily: "var(--font-mono)", fontSize: 13,
        lineHeight: 1.6, color: "var(--code-fg)" }}
        dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

export function XmlFormatterScreen() {
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

export function Base64Screen() {
  const [input, setInput] = React.useState("");
  const [mode, setMode] = React.useState("Encode");
  const sv = useSplitView("Input", "Output");

  const output = React.useMemo(() => {
    if (!input) return "";
    try {
      if (mode === "Encode") {
        return btoa(unescape(encodeURIComponent(input)));
      } else {
        return decodeURIComponent(escape(atob(input)));
      }
    } catch (e) {
      return "Error: " + (e.message || "Invalid Base64 string");
    }
  }, [input, mode]);

  const hasError = output.startsWith("Error: ");
  const displayOutput = hasError ? output.substring(7) : output;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <SegmentedControl options={["Encode", "Decode"]} value={mode} onChange={setMode} />
        {sv.control}
        <span style={{ marginLeft: "auto" }}>
          <Button variant="ghost" size="sm" icon="rotate-ccw" onClick={() => setInput(mode === "Encode" ? "Pocket is awesome" : "UG9ja2V0IGlzIGF3ZXNvbWU=")}>Sample</Button>
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: sv.columns, gap: 14 }}>
        <Panel style={sv.leftStyle} title="Input" variant="sunken" meta={input.length.toLocaleString() + " chars"}
          actions={<IconButton icon="x" label="Clear" size="sm" onClick={() => setInput("")} />}>
          <Textarea bare value={input} onChange={(e) => setInput(e.target.value)}
            placeholder={mode === "Encode" ? "Type text to encode..." : "Paste Base64 to decode..."} style={{ flex: 1, padding: "12px 14px", minHeight: 0 }} />
        </Panel>
        <Panel style={sv.rightStyle} title="Output" variant="code"
          meta={hasError ? <Badge kind="danger">Decode error</Badge> : input.trim() ? <Badge kind="ok" dot>{mode === "Encode" ? "Encoded" : "Decoded"}</Badge> : null}
          actions={<CopyButton onDark getText={() => displayOutput} />}>
          {hasError ? (
            <div style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.6, color: "#E08A76" }}>{displayOutput}</div>
          ) : (
            <pre style={{ margin: 0, padding: "12px 16px", overflow: "auto", flex: 1, fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.6, color: "var(--code-fg)", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{displayOutput}</pre>
          )}
        </Panel>
      </div>
    </div>
  );
}

const SAMPLE_ENCODE = "https://example.com/search?q=café & crème brûlée#top";
const SAMPLE_PARSE = "https://user:s3cr3t@shop.example.com:8443/catalog/men's shoes?color=blue&size=10&q=hello world#reviews";

export function UrlCodecScreen() {
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

export function HashScreen() {
  const [input, setInput] = React.useState("pocket");
  const sv = useSplitView("Input", "Hashes");
  const [hashes, setHashes] = React.useState({
    md5: "",
    sha1: "",
    sha256: "",
    sha512: "",
    sha3: "",
    blake2: "",
    blake3: ""
  });

  React.useEffect(() => {
    if (!input) {
      setHashes({
        md5: "",
        sha1: "",
        sha256: "",
        sha512: "",
        sha3: "",
        blake2: "",
        blake3: ""
      });
      return;
    }

    const handler = setTimeout(async () => {
      let md5Val = "";
      try {
        md5Val = md5(input);
      } catch (e) {
        console.error(e);
      }

      let sha1Val = "";
      let sha256Val = "";
      let sha512Val = "";
      try {
        const msgUint8 = new TextEncoder().encode(input);

        const sha1Buffer = await crypto.subtle.digest("SHA-1", msgUint8);
        const sha1Array = Array.from(new Uint8Array(sha1Buffer));
        sha1Val = sha1Array.map(b => b.toString(16).padStart(2, "0")).join("");

        const sha256Buffer = await crypto.subtle.digest("SHA-256", msgUint8);
        const sha256Array = Array.from(new Uint8Array(sha256Buffer));
        sha256Val = sha256Array.map(b => b.toString(16).padStart(2, "0")).join("");

        const sha512Buffer = await crypto.subtle.digest("SHA-512", msgUint8);
        const sha512Array = Array.from(new Uint8Array(sha512Buffer));
        sha512Val = sha512Array.map(b => b.toString(16).padStart(2, "0")).join("");
      } catch (e) {
        console.error(e);
      }

      let sha3Val = "";
      let blake2Val = "";
      let blake3Val = "";
      try {
        sha3Val = await sha3(input);
        blake2Val = await blake2b(input);
        blake3Val = await blake3(input);
      } catch (e) {
        console.error(e);
      }

      setHashes({
        md5: md5Val,
        sha1: sha1Val,
        sha256: sha256Val,
        sha512: sha512Val,
        sha3: sha3Val,
        blake2: blake2Val,
        blake3: blake3Val
      });
    }, 150);

    return () => clearTimeout(handler);
  }, [input]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {sv.control}
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: sv.columns, gap: 14 }}>
        <Panel style={sv.leftStyle} title="Input" variant="sunken" meta={input.length.toLocaleString() + " chars"}
          actions={<IconButton icon="x" label="Clear" size="sm" onClick={() => setInput("")} />}>
          <Textarea bare value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Type text to hash..." style={{ flex: 1, padding: "12px 14px", minHeight: 0 }} />
        </Panel>

        <Panel style={sv.rightStyle} title="Hashes" variant="code">
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", flex: 1 }}>

            {/* MD5 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--syn-comment)", letterSpacing: "var(--tracking-caps)" }}>MD5</span>
                {hashes.md5 && <CopyButton onDark size="sm" getText={() => hashes.md5} />}
              </div>
              <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: hashes.md5 ? "var(--code-fg)" : "var(--text-tertiary)", wordBreak: "break-all", background: "rgba(0,0,0,0.2)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>
                {hashes.md5 || "—"}
              </code>
            </div>

            {/* SHA-1 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--syn-comment)", letterSpacing: "var(--tracking-caps)" }}>SHA-1</span>
                {hashes.sha1 && <CopyButton onDark size="sm" getText={() => hashes.sha1} />}
              </div>
              <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: hashes.sha1 ? "var(--code-fg)" : "var(--text-tertiary)", wordBreak: "break-all", background: "rgba(0,0,0,0.2)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>
                {hashes.sha1 || "—"}
              </code>
            </div>

            {/* SHA-256 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--syn-comment)", letterSpacing: "var(--tracking-caps)" }}>SHA-256</span>
                {hashes.sha256 && <CopyButton onDark size="sm" getText={() => hashes.sha256} />}
              </div>
              <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: hashes.sha256 ? "var(--code-fg)" : "var(--text-tertiary)", wordBreak: "break-all", background: "rgba(0,0,0,0.2)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>
                {hashes.sha256 || "—"}
              </code>
            </div>

            {/* SHA-512 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--syn-comment)", letterSpacing: "var(--tracking-caps)" }}>SHA-512</span>
                {hashes.sha512 && <CopyButton onDark size="sm" getText={() => hashes.sha512} />}
              </div>
              <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: hashes.sha512 ? "var(--code-fg)" : "var(--text-tertiary)", wordBreak: "break-all", background: "rgba(0,0,0,0.2)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>
                {hashes.sha512 || "—"}
              </code>
            </div>

            {/* SHA-3 (Keccak-512 / Standard) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--syn-comment)", letterSpacing: "var(--tracking-caps)" }}>SHA-3</span>
                {hashes.sha3 && <CopyButton onDark size="sm" getText={() => hashes.sha3} />}
              </div>
              <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: hashes.sha3 ? "var(--code-fg)" : "var(--text-tertiary)", wordBreak: "break-all", background: "rgba(0,0,0,0.2)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>
                {hashes.sha3 || "—"}
              </code>
            </div>

            {/* BLAKE2 (BLAKE2b-512) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--syn-comment)", letterSpacing: "var(--tracking-caps)" }}>BLAKE2</span>
                {hashes.blake2 && <CopyButton onDark size="sm" getText={() => hashes.blake2} />}
              </div>
              <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: hashes.blake2 ? "var(--code-fg)" : "var(--text-tertiary)", wordBreak: "break-all", background: "rgba(0,0,0,0.2)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>
                {hashes.blake2 || "—"}
              </code>
            </div>

            {/* BLAKE3 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--syn-comment)", letterSpacing: "var(--tracking-caps)" }}>BLAKE3</span>
                {hashes.blake3 && <CopyButton onDark size="sm" getText={() => hashes.blake3} />}
              </div>
              <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: hashes.blake3 ? "var(--code-fg)" : "var(--text-tertiary)", wordBreak: "break-all", background: "rgba(0,0,0,0.2)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>
                {hashes.blake3 || "—"}
              </code>
            </div>

          </div>
        </Panel>
      </div>
    </div>
  );
}

const UNIT_CATEGORIES = {
  Length: {
    units: [
      { id: "m", label: "Meters (m)", factor: 1 },
      { id: "km", label: "Kilometers (km)", factor: 1000 },
      { id: "mi", label: "Miles (mi)", factor: 1609.344 },
      { id: "ft", label: "Feet (ft)", factor: 0.3048 },
      { id: "in", label: "Inches (in)", factor: 0.0254 }
    ]
  },
  Mass: {
    units: [
      { id: "kg", label: "Kilograms (kg)", factor: 1 },
      { id: "g", label: "Grams (g)", factor: 0.001 },
      { id: "lb", label: "Pounds (lb)", factor: 0.45359237 },
      { id: "oz", label: "Ounces (oz)", factor: 0.028349523 }
    ]
  },
  Data: {
    units: [
      { id: "B", label: "Bytes (B)", factor: 1 },
      { id: "KB", label: "Kilobytes (KB)", factor: 1024 },
      { id: "MB", label: "Megabytes (MB)", factor: 1024 * 1024 },
      { id: "GB", label: "Gigabytes (GB)", factor: 1024 * 1024 * 1024 },
      { id: "TB", label: "Terabytes (TB)", factor: 1024 * 1024 * 1024 * 1024 }
    ]
  },
  Temperature: {
    units: [
      { id: "C", label: "Celsius (°C)" },
      { id: "F", label: "Fahrenheit (°F)" },
      { id: "K", label: "Kelvin (K)" }
    ]
  }
};

export function UnitConverterScreen() {
  const [category, setCategory] = React.useState("Length");
  const units = UNIT_CATEGORIES[category].units;
  const [fromUnit, setFromUnit] = React.useState(units[0].id);
  const [toUnit, setToUnit] = React.useState(units[1]?.id || units[0].id);
  const [inputVal, setInputVal] = React.useState("1");

  React.useEffect(() => {
    const nextUnits = UNIT_CATEGORIES[category].units;
    setFromUnit(nextUnits[0].id);
    setToUnit(nextUnits[1]?.id || nextUnits[0].id);
  }, [category]);

  const outputVal = React.useMemo(() => {
    const num = Number(inputVal);
    if (isNaN(num)) return "Invalid number";
    if (category === "Temperature") {
      if (fromUnit === toUnit) return num.toString();
      let celsius = num;
      if (fromUnit === "F") celsius = (num - 32) * 5/9;
      if (fromUnit === "K") celsius = num - 273.15;
      
      let res = celsius;
      if (toUnit === "F") res = (celsius * 9/5) + 32;
      if (toUnit === "K") res = celsius + 273.15;
      return Number(res.toFixed(6)).toString();
    } else {
      const fromObj = units.find(u => u.id === fromUnit);
      const toObj = units.find(u => u.id === toUnit);
      if (!fromObj || !toObj) return "";
      const baseVal = num * fromObj.factor;
      const convertedVal = baseVal / toObj.factor;
      return Number(convertedVal.toFixed(9)).toString();
    }
  }, [inputVal, category, fromUnit, toUnit, units]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <SegmentedControl options={["Length", "Mass", "Data", "Temperature"]} value={category} onChange={setCategory} />
        <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>From</span>
        <Select options={units.map(u => ({ value: u.id, label: u.label }))} value={fromUnit} onChange={e => setFromUnit(e.target.value)} />
        <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>To</span>
        <Select options={units.map(u => ({ value: u.id, label: u.label }))} value={toUnit} onChange={e => setToUnit(e.target.value)} />
        <span style={{ marginLeft: "auto" }}>
          <Button variant="ghost" size="sm" icon="rotate-ccw" onClick={() => setInputVal("1")}>Reset</Button>
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Panel title="Input Value" variant="sunken"
          actions={<IconButton icon="x" label="Clear" size="sm" onClick={() => setInputVal("")} />}>
          <div style={{ padding: "20px 24px" }}>
            <Input mono value={inputVal} onChange={e => setInputVal(e.target.value)} placeholder="Enter numeric value..." style={{ height: 42, fontSize: 16, maxWidth: 360 }} />
          </div>
        </Panel>
        <Panel title="Result" variant="code" actions={<CopyButton onDark getText={() => outputVal} />}>
          <div style={{ padding: "24px 28px", fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 500, color: "var(--code-fg)", wordBreak: "break-all" }}>
            {outputVal}
            <span style={{ fontSize: 14, color: "var(--syn-comment)", marginLeft: 10, fontFamily: "var(--font-sans)", fontWeight: 400 }}>{toUnit}</span>
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function TimestampConverterScreen() {
  const [input, setInput] = React.useState(() => Math.floor(Date.now() / 1000).toString());
  
  const results = React.useMemo(() => {
    if (!input.trim()) return null;
    let date = null;
    let isTimestamp = false;
    let format = "";
    
    if (/^\d+$/.test(input.trim())) {
      const num = Number(input.trim());
      isTimestamp = true;
      if (num > 30000000000) {
        date = new Date(num);
        format = "Milliseconds";
      } else {
        date = new Date(num * 1000);
        format = "Seconds";
      }
    } else {
      const ms = Date.parse(input.trim());
      if (!isNaN(ms)) {
        date = new Date(ms);
        format = "Date String";
      }
    }
    
    if (!date || isNaN(date.getTime())) {
      return { error: "Invalid date format or timestamp" };
    }
    
    const sec = Math.floor(date.getTime() / 1000);
    const ms = date.getTime();
    
    const diff = ms - Date.now();
    const absDiff = Math.abs(diff);
    const mins = Math.floor(absDiff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    let relative = "just now";
    if (mins > 0) {
      if (days > 0) relative = days === 1 ? "1 day" : `${days} days`;
      else if (hours > 0) relative = hours === 1 ? "1 hour" : `${hours} hours`;
      else relative = mins === 1 ? "1 minute" : `${mins} minutes`;
      relative = diff > 0 ? `in ${relative}` : `${relative} ago`;
    }

    return {
      sec: sec.toString(),
      ms: ms.toString(),
      iso: date.toISOString(),
      local: date.toString(),
      relative: relative,
      format: format
    };
  }, [input]);

  const loadCurrent = () => {
    setInput(Math.floor(Date.now() / 1000).toString());
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Button variant="secondary" size="sm" icon="clock" onClick={loadCurrent}>Current Time</Button>
        <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
          Automatically detects unix timestamps (s/ms) or human date strings.
        </span>
      </div>
      
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Panel title="Input Date / Epoch" variant="sunken"
          actions={<IconButton icon="x" label="Clear" size="sm" onClick={() => setInput("")} />}>
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
            <Input mono value={input} onChange={e => setInput(e.target.value)} placeholder="Epoch timestamp or date string..." style={{ height: 42, fontSize: 16 }} />
            {results && !results.error && (
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Detected format: <strong>{results.format}</strong>
              </span>
            )}
          </div>
        </Panel>
        
        <Panel title="Conversions" variant="code">
          {results?.error ? (
            <div style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: 13, color: "#E08A76" }}>{results.error}</div>
          ) : results ? (
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", flex: 1 }}>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--syn-comment)", letterSpacing: "var(--tracking-caps)" }}>Unix Timestamp (seconds)</span>
                  <CopyButton onDark size="sm" getText={() => results.sec} />
                </div>
                <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--code-fg)", background: "rgba(0,0,0,0.2)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>{results.sec}</code>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--syn-comment)", letterSpacing: "var(--tracking-caps)" }}>Unix Timestamp (milliseconds)</span>
                  <CopyButton onDark size="sm" getText={() => results.ms} />
                </div>
                <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--code-fg)", background: "rgba(0,0,0,0.2)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>{results.ms}</code>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--syn-comment)", letterSpacing: "var(--tracking-caps)" }}>ISO 8601 (UTC)</span>
                  <CopyButton onDark size="sm" getText={() => results.iso} />
                </div>
                <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--code-fg)", background: "rgba(0,0,0,0.2)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>{results.iso}</code>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--syn-comment)", letterSpacing: "var(--tracking-caps)" }}>Local Time</span>
                  <CopyButton onDark size="sm" getText={() => results.local} />
                </div>
                <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--code-fg)", background: "rgba(0,0,0,0.2)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>{results.local}</code>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--syn-comment)", letterSpacing: "var(--tracking-caps)" }}>Relative Time</span>
                <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--code-fg)", background: "rgba(0,0,0,0.2)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>{results.relative}</code>
              </div>

            </div>
          ) : (
            <div style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-tertiary)" }}>Type a valid input to see conversion results.</div>
          )}
        </Panel>
      </div>
    </div>
  );
}

const TIMEZONES = [
  { id: "UTC", name: "Coordinated Universal Time (UTC)" },
  { id: "America/New_York", name: "New York (EST/EDT)" },
  { id: "Europe/London", name: "London (GMT/BST)" },
  { id: "Europe/Paris", name: "Paris (CET/CEST)" },
  { id: "Asia/Tokyo", name: "Tokyo (JST)" },
  { id: "Australia/Sydney", name: "Sydney (AEST/AEDT)" }
];

export function TimezoneConverterScreen() {
  const [baseDate, setBaseDate] = React.useState(() => {
    const now = new Date();
    const pad = n => n.toString().padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  });
  const [sourceZone, setSourceZone] = React.useState("UTC");

  const results = React.useMemo(() => {
    if (!baseDate) return [];
    
    let date = new Date(baseDate);
    if (isNaN(date.getTime())) return [];
    
    if (sourceZone !== "UTC") {
      try {
        const utcStr = date.toLocaleString("en-US", { timeZone: "UTC" });
        const srcStr = date.toLocaleString("en-US", { timeZone: sourceZone });
        const diffMs = Date.parse(utcStr) - Date.parse(srcStr);
        date = new Date(date.getTime() + diffMs);
      } catch (e) {
        console.error(e);
      }
    } else {
      const parts = baseDate.split(/[-T:]/);
      if (parts.length >= 5) {
        date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], parts[3], parts[4]));
      }
    }

    if (isNaN(date.getTime())) return [];

    return TIMEZONES.map(tz => {
      try {
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: tz.id,
          year: "numeric", month: "short", day: "2-digit",
          hour: "2-digit", minute: "2-digit", second: "2-digit",
          hour12: false
        });
        const formatted = formatter.format(date);
        return {
          id: tz.id,
          name: tz.name,
          time: formatted
        };
      } catch (e) {
        return {
          id: tz.id,
          name: tz.name,
          time: "Unsupported timezone"
        };
      }
    });
  }, [baseDate, sourceZone]);

  const loadCurrent = () => {
    const now = new Date();
    const pad = n => n.toString().padStart(2, "0");
    setBaseDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Button variant="secondary" size="sm" icon="clock" onClick={loadCurrent}>Current Time</Button>
        <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Source Zone</span>
        <Select options={TIMEZONES.map(tz => ({ value: tz.id, label: tz.name }))} value={sourceZone} onChange={e => setSourceZone(e.target.value)} />
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Panel title="Source DateTime" variant="sunken">
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>Enter source date and time:</span>
            <input type="datetime-local" value={baseDate} onChange={e => setBaseDate(e.target.value)} 
              style={{
                height: 42, padding: "0 14px", fontFamily: "var(--font-mono)", fontSize: 16,
                color: "var(--text-primary)", background: "var(--surface-sunken)",
                border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)",
                outline: "none", width: "100%", maxWidth: 320
              }} />
          </div>
        </Panel>

        <Panel title="Comparisons" variant="code">
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", flex: 1 }}>
            {results.map(res => (
              <div key={res.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--syn-comment)", letterSpacing: "var(--tracking-caps)" }}>{res.name}</span>
                  <CopyButton onDark size="sm" getText={() => res.time} />
                </div>
                <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--code-fg)", background: "rgba(0,0,0,0.2)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>{res.time}</code>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function QrCodeScreen() {
  const [input, setInput] = React.useState("https://usepocket.vercel.app/");
  const [qrDataUrl, setQrDataUrl] = React.useState("");

  React.useEffect(() => {
    if (!input.trim()) {
      setQrDataUrl("");
      return;
    }
    QRCode.toDataURL(input.trim(), { width: 300, margin: 2 }, (err, url) => {
      if (!err) setQrDataUrl(url);
    });
  }, [input]);

  const downloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = "qrcode.png";
    a.click();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Panel title="Input Text or URL" variant="sunken"
          actions={<IconButton icon="x" label="Clear" size="sm" onClick={() => setInput("")} />}>
          <Textarea bare value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Type text or URL here to generate QR code..." style={{ flex: 1, padding: "12px 14px", minHeight: 0 }} />
        </Panel>
        
        <Panel title="QR Code Preview" variant="raised"
          actions={<Button size="sm" icon="download" onClick={downloadQr} disabled={!qrDataUrl}>Download</Button>}>
          <div style={{ display: "grid", placeItems: "center", flex: 1, padding: 24, background: "var(--code-bg)" }}>
            {qrDataUrl ? (
              <div style={{ padding: 16, background: "#fff", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-1)" }}>
                <img src={qrDataUrl} alt="QR Code" style={{ display: "block", width: 200, height: 200 }} />
              </div>
            ) : (
              <div style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", fontSize: 13 }}>Type something to generate a QR Code</div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

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

export function LoremIpsumScreen() {
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

export function UuidScreen() {
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

export function CaseConverterScreen() {
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

export function WordCounterScreen() {
  const [input, setInput] = React.useState("The quick brown fox jumps over the lazy dog.");
  const sv = useSplitView("Input", "Analysis");

  const stats = React.useMemo(() => {
    const charsWithSpaces = input.length;
    const charsWithoutSpaces = input.replace(/\s/g, "").length;
    
    const wordsList = input.trim().split(/\s+/).filter(Boolean);
    const wordCount = wordsList.length;
    
    const sentenceCount = input.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const paragraphCount = input.split(/\n+/).filter(p => p.trim().length > 0).length;
    const lineCount = input ? input.split(/\n/).length : 0;
    
    // Reading/speaking time
    const readTimeSec = Math.round((wordCount / 200) * 60);
    const readTimeStr = readTimeSec < 60 ? `${readTimeSec}s` : `${Math.ceil(readTimeSec / 60)} min`;
    
    const speakTimeSec = Math.round((wordCount / 130) * 60);
    const speakTimeStr = speakTimeSec < 60 ? `${speakTimeSec}s` : `${Math.ceil(speakTimeSec / 60)} min`;

    // Word frequencies
    const freq = {};
    wordsList.forEach(w => {
      const cleanWord = w.toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
      if (cleanWord.length > 1) { // ignore single-char filler like "a" or punctuation
        freq[cleanWord] = (freq[cleanWord] || 0) + 1;
      }
    });
    const topWords = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return {
      charsWithSpaces,
      charsWithoutSpaces,
      wordCount,
      sentenceCount,
      paragraphCount,
      lineCount,
      readTimeStr,
      speakTimeStr,
      topWords
    };
  }, [input]);

  const metrics = [
    { label: "Words", value: stats.wordCount },
    { label: "Characters", value: stats.charsWithSpaces },
    { label: "Chars (no space)", value: stats.charsWithoutSpaces },
    { label: "Sentences", value: stats.sentenceCount },
    { label: "Paragraphs", value: stats.paragraphCount },
    { label: "Lines", value: stats.lineCount }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {sv.control}
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: sv.columns, gap: 14 }}>
        <Panel style={sv.leftStyle} title="Input Text" variant="sunken"
          actions={<IconButton icon="x" label="Clear" size="sm" onClick={() => setInput("")} />}>
          <Textarea bare value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Type or paste text to count..." style={{ flex: 1, padding: "12px 14px", minHeight: 0 }} />
        </Panel>

        <Panel style={sv.rightStyle} title="Analysis" variant="raised">
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 24, overflowY: "auto", flex: 1 }}>
            
            {/* Grid Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {metrics.map(m => (
                <div key={m.label} style={{ background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "var(--tracking-caps)" }}>{m.label}</span>
                  <span style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)" }}>{m.value.toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Speaking/Reading Times */}
            <div style={{ display: "flex", gap: 14 }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: "rgba(0,0,0,0.15)", padding: "10px 14px", borderRadius: "var(--radius-md)" }}>
                <Icon name="book-open" size={18} style={{ color: "var(--amber-500)" }} />
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Reading Time</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>{stats.readTimeStr}</div>
                </div>
              </div>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: "rgba(0,0,0,0.15)", padding: "10px 14px", borderRadius: "var(--radius-md)" }}>
                <Icon name="megaphone" size={18} style={{ color: "var(--amber-500)" }} />
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Speaking Time</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>{stats.speakTimeStr}</div>
                </div>
              </div>
            </div>

            {/* Word Frequencies */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "var(--tracking-caps)" }}>Keyword Density</span>
              {stats.topWords.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {stats.topWords.map(([word, count]) => {
                    const pct = Math.round((count / stats.wordCount) * 100);
                    return (
                      <div key={word} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ width: 100, fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis" }}>{word}</span>
                        <div style={{ flex: 1, height: 6, background: "var(--surface-sunken)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.min(pct * 3, 100)}%`, background: "var(--amber-500)", borderRadius: 3 }} />
                        </div>
                        <span style={{ width: 60, fontSize: 12, textAlign: "right", color: "var(--text-tertiary)" }}>{count} ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <span style={{ fontSize: 13, color: "var(--text-tertiary)", fontStyle: "italic" }}>Type more words to see density analytics.</span>
              )}
            </div>

          </div>
        </Panel>
      </div>
    </div>
  );
}

export function RegexScreen() {
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

export function StubScreen({ tool }) {
  return (
    <div style={{ display: "grid", placeItems: "center", height: "100%" }}>
      <EmptyState icon={tool.icon} title={tool.name + " isn't built in this UI kit"}
        hint="It would follow the same layout: options on top, input and output side by side." />
    </div>
  );
}
