// Pocket — Syntax Highlighter. Colorizes a snippet with highlight.js (auto-detect
// or explicit language) and emits portable, inline-styled HTML you can paste into
// docs/email with colours intact. 100% client-side. DS primitives + tokens only.
import React from "react";
import hljs from "highlight.js";
import { Panel } from "../../Pocket Design System/components/surfaces/Panel.jsx";
import { Textarea } from "../../Pocket Design System/components/forms/Textarea.jsx";
import { Badge } from "../../Pocket Design System/components/core/Badge.jsx";
import { Button } from "../../Pocket Design System/components/core/Button.jsx";
import { IconButton } from "../../Pocket Design System/components/core/IconButton.jsx";
import { CopyButton } from "../../Pocket Design System/components/core/CopyButton.jsx";
import { Select } from "../../Pocket Design System/components/forms/Select.jsx";
import { Switch } from "../../Pocket Design System/components/forms/Switch.jsx";

const LANGUAGES = [
  { value: "auto", label: "Auto-detect" },
  { value: "javascript", label: "JavaScript" }, { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" }, { value: "java", label: "Java" },
  { value: "c", label: "C" }, { value: "cpp", label: "C++" }, { value: "csharp", label: "C#" },
  { value: "go", label: "Go" }, { value: "rust", label: "Rust" }, { value: "ruby", label: "Ruby" },
  { value: "php", label: "PHP" }, { value: "bash", label: "Bash" }, { value: "json", label: "JSON" },
  { value: "xml", label: "HTML / XML" }, { value: "css", label: "CSS" }, { value: "scss", label: "SCSS" },
  { value: "sql", label: "SQL" }, { value: "yaml", label: "YAML" }, { value: "markdown", label: "Markdown" },
  { value: "kotlin", label: "Kotlin" }, { value: "swift", label: "Swift" }, { value: "dart", label: "Dart" },
  { value: "lua", label: "Lua" }, { value: "perl", label: "Perl" }, { value: "plaintext", label: "Plain text" },
];

// hljs scope (first class token) -> colour. Keys cover the common emitted scopes.
const GITHUB = { base: { bg: "#ffffff", fg: "#24292e" }, scopes: { keyword: "#d73a49", "selector-tag": "#22863a", literal: "#005cc5", number: "#005cc5", string: "#032f62", regexp: "#032f62", "meta-string": "#032f62", comment: "#6a737d", quote: "#6a737d", doctag: "#6a737d", meta: "#6a737d", built_in: "#e36209", type: "#d73a49", title: "#6f42c1", "function": "#6f42c1", "class": "#6f42c1", attr: "#005cc5", attribute: "#22863a", variable: "#e36209", "template-variable": "#e36209", tag: "#22863a", name: "#22863a", "selector-class": "#6f42c1", "selector-id": "#6f42c1", symbol: "#e36209", bullet: "#735c0f", link: "#032f62", operator: "#d73a49", "selector-pseudo": "#6f42c1", property: "#005cc5", params: "#24292e", addition: "#22863a", deletion: "#b31d28", section: "#005cc5" } };
const ONEDARK = { base: { bg: "#282c34", fg: "#abb2bf" }, scopes: { keyword: "#c678dd", "selector-tag": "#e06c75", literal: "#56b6c2", number: "#d19a66", string: "#98c379", regexp: "#98c379", "meta-string": "#98c379", comment: "#5c6370", quote: "#5c6370", doctag: "#7f848e", meta: "#7f848e", built_in: "#e5c07b", type: "#e5c07b", title: "#61afef", "function": "#61afef", "class": "#e5c07b", attr: "#d19a66", attribute: "#98c379", variable: "#e06c75", "template-variable": "#e06c75", tag: "#e06c75", name: "#e06c75", "selector-class": "#d19a66", "selector-id": "#61afef", symbol: "#56b6c2", bullet: "#61afef", link: "#56b6c2", operator: "#56b6c2", "selector-pseudo": "#56b6c2", property: "#e06c75", params: "#abb2bf", addition: "#98c379", deletion: "#e06c75", section: "#e06c75" } };

// "Pocket" theme reads the app's --syn-* / --code-* tokens so it matches the UI.
function pocketTheme() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n) => cs.getPropertyValue(n).trim();
  const kw = v("--syn-keyword"), key = v("--syn-key"), str = v("--syn-string"), num = v("--syn-number"), com = v("--syn-comment"), pun = v("--syn-punct"), fg = v("--code-fg");
  return {
    base: { bg: v("--code-bg"), fg },
    scopes: {
      keyword: kw, "selector-tag": kw, built_in: kw, type: kw, literal: num, number: num,
      string: str, regexp: str, "meta-string": str, char: str, comment: com, quote: com, doctag: com, meta: com,
      title: key, "function": key, "class": kw, attr: key, attribute: key, variable: key, "template-variable": key,
      tag: kw, name: kw, "selector-class": key, "selector-id": key, symbol: num, bullet: num, link: str,
      operator: pun, punctuation: pun, "selector-pseudo": key, property: key, params: fg, addition: str, deletion: pun, section: kw,
    },
  };
}
const THEMES = { pocket: pocketTheme, github: () => GITHUB, onedark: () => ONEDARK };

// Restrict auto-detect to common languages — the full set mis-detects short
// snippets as obscure languages (isbl, etc.).
const AUTO_SUBSET = LANGUAGES.map((l) => l.value).filter((v) => v !== "auto" && v !== "plaintext");

function inlineStyle(value, scopes) {
  return value.replace(/<span class="hljs-([^"]+)">/g, (m, scope) => {
    const c = scopes[scope.split(" ")[0]];
    return c ? `<span style="color:${c}">` : "<span>";
  });
}

function download(text, name, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const SAMPLE = `// A quick fibonacci, the iterative way.
function fib(n) {
  let [a, b] = [0, 1];
  for (let i = 0; i < n; i++) {
    [a, b] = [b, a + b]; // tuple swap
  }
  return a;
}

const seq = Array.from({ length: 10 }, (_, i) => fib(i));
console.log("fib:", seq.join(", "));`;

export default function SyntaxHighlighterScreen() {
  const [code, setCode] = React.useState(SAMPLE);
  const [language, setLanguage] = React.useState("auto");
  const [themeKey, setThemeKey] = React.useState("pocket");
  const [wrap, setWrap] = React.useState(false);
  const [lineNos, setLineNos] = React.useState(true);
  const [copied, setCopied] = React.useState(false);

  const theme = THEMES[themeKey]();

  const result = React.useMemo(() => {
    if (!code) return { html: "", detected: "—" };
    try {
      let res, detected;
      if (language === "auto") { res = hljs.highlightAuto(code, AUTO_SUBSET); detected = res.language || "plaintext"; }
      else { res = hljs.highlight(code, { language, ignoreIllegals: true }); detected = language; }
      return { html: inlineStyle(res.value, theme.scopes), detected };
    } catch (e) {
      return { html: "", detected: "error", error: (e && e.message) || String(e) };
    }
  }, [code, language, themeKey]);

  const exportHtml = React.useMemo(() => {
    if (!result.html) return "";
    return `<pre style="background:${theme.base.bg};color:${theme.base.fg};padding:16px;border-radius:8px;overflow:auto;` +
      `font-family:'JetBrains Mono',ui-monospace,Consolas,monospace;font-size:13px;line-height:1.6;tab-size:2"><code>${result.html}</code></pre>`;
  }, [result.html, themeKey]);

  const copyRich = async () => {
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new window.ClipboardItem({
          "text/html": new Blob([exportHtml], { type: "text/html" }),
          "text/plain": new Blob([code], { type: "text/plain" }),
        })]);
      } else { await navigator.clipboard.writeText(exportHtml); }
      setCopied(true); setTimeout(() => setCopied(false), 1400);
    } catch (e) { /* ignore */ }
  };

  const lineCount = code ? code.split("\n").length : 0;
  const showGutter = lineNos && !wrap;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Select value={language} onChange={(e) => setLanguage(e.target.value)} options={LANGUAGES} />
        <Select value={themeKey} onChange={(e) => setThemeKey(e.target.value)}
          options={[{ value: "pocket", label: "Theme: Pocket" }, { value: "github", label: "Theme: GitHub" }, { value: "onedark", label: "Theme: One Dark" }]} />
        <Switch checked={wrap} onChange={setWrap} label="Wrap" />
        <Switch checked={lineNos} onChange={setLineNos} label="Line numbers" />
        <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Button variant="ghost" size="sm" icon="rotate-ccw" onClick={() => setCode(SAMPLE)}>Sample</Button>
        </span>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Panel title="Code" variant="sunken" meta={lineCount + (lineCount === 1 ? " line" : " lines")}
          actions={<IconButton icon="x" label="Clear" size="sm" onClick={() => setCode("")} />}>
          <Textarea bare mono value={code} onChange={(e) => setCode(e.target.value)}
            placeholder="Paste code to highlight…" style={{ flex: 1, padding: "12px 14px", minHeight: 0 }} />
        </Panel>

        <Panel title="Highlighted" variant="sunken"
          meta={<Badge kind={result.detected === "error" ? "danger" : "neutral"}>{language === "auto" ? "auto · " + result.detected : result.detected}</Badge>}
          actions={result.html ? (
            <span style={{ display: "flex", gap: 6 }}>
              <Button variant="secondary" size="sm" icon={copied ? "check" : "clipboard"} onClick={copyRich}>{copied ? "Copied" : "Copy rich"}</Button>
              <CopyButton getText={() => exportHtml} label="HTML" />
              <IconButton icon="download" label="Download HTML" size="sm" onClick={() => download(exportHtml, "snippet.html", "text/html")} />
            </span>
          ) : null}>
          {result.error ? (
            <div style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: 13, color: "#E08A76" }}>{result.error}</div>
          ) : (
            <div style={{ flex: 1, minHeight: 0, overflow: "auto", display: "flex", background: theme.base.bg }}>
              {showGutter ? (
                <div aria-hidden style={{ flex: "none", padding: "12px 8px 12px 14px", textAlign: "right", color: theme.base.fg, opacity: 0.4, fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.6, userSelect: "none" }}>
                  {Array.from({ length: lineCount }, (_, i) => <div key={i}>{i + 1}</div>)}
                </div>
              ) : null}
              <pre style={{ margin: 0, padding: "12px 14px", flex: 1, minWidth: 0, color: theme.base.fg, fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.6, whiteSpace: wrap ? "pre-wrap" : "pre", wordBreak: wrap ? "break-word" : "normal", tabSize: 2 }}
                dangerouslySetInnerHTML={{ __html: result.html || "" }} />
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
