// Pocket — Markdown Previewer. Full GFM (tables, task lists, strikethrough, footnotes),
// LaTeX math via KaTeX (inline $…$ and block $$…$$), code syntax highlighting, sanitized
// output, and .md file import (button + drag-and-drop). Built from DS primitives + tokens.
import React from "react";
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import markedKatex from "marked-katex-extension";
import markedFootnote from "marked-footnote";
import hljs from "highlight.js/lib/common";
import DOMPurify from "dompurify";
import "katex/dist/katex.min.css";
import { Panel } from "../../Pocket Design System/components/surfaces/Panel.jsx";
import { Textarea } from "../../Pocket Design System/components/forms/Textarea.jsx";
import { Button } from "../../Pocket Design System/components/core/Button.jsx";
import { IconButton } from "../../Pocket Design System/components/core/IconButton.jsx";
import { CopyButton } from "../../Pocket Design System/components/core/CopyButton.jsx";
import { SegmentedControl } from "../../Pocket Design System/components/forms/SegmentedControl.jsx";

// One configured Marked instance (highlight + math + footnotes + GFM).
const marked = new Marked(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const language = lang && hljs.getLanguage(lang) ? lang : "plaintext";
      try { return hljs.highlight(code, { language }).value; } catch (e) { return code; }
    },
  })
);
marked.use(markedKatex({ throwOnError: false, nonStandard: true }));
marked.use(markedFootnote());
marked.setOptions({ gfm: true, breaks: false });

// Block math ($$…$$) only parses when the delimiters sit on their own block. Many people
// write it right under a line of text with no blank line, so surround standalone `$$`
// delimiter lines with blank lines — but never touch fenced code blocks.
function ensureMathBlocks(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let inFence = false, fenceTok = "", inMath = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.trim();
    const fence = t.match(/^(```|~~~)/);
    if (!inMath && fence) {
      if (!inFence) { inFence = true; fenceTok = fence[1]; }
      else if (t.startsWith(fenceTok)) { inFence = false; }
      out.push(line);
      continue;
    }
    if (inFence) { out.push(line); continue; }
    if (t === "$$") {
      if (!inMath) {
        if (out.length && out[out.length - 1].trim() !== "") out.push("");
        out.push(line);
        inMath = true;
      } else {
        out.push(line);
        inMath = false;
        if (i + 1 < lines.length && lines[i + 1].trim() !== "") out.push("");
      }
      continue;
    }
    out.push(line);
  }
  return out.join("\n");
}

function render(md) {
  if (!md.trim()) return "";
  const raw = marked.parse(ensureMathBlocks(md));
  return DOMPurify.sanitize(raw);
}

const SAMPLE = `# Markdown Previewer

Supports **GitHub-flavored** Markdown, _scientific_ notation, and full LaTeX math.

## Text & lists

- Bold **text**, italic _text_, ~~strikethrough~~, \`inline code\`
- [Links](https://pocket.dev) and footnotes[^1]

1. First
2. Second
   - nested item

- [x] Completed task
- [ ] Pending task

## Table

| Element  | Symbol | Z |
|----------|--------|--:|
| Hydrogen | H      | 1 |
| Helium   | He     | 2 |

## Math

Inline — the mass–energy relation is $E = mc^2$.

Block:

$$
\\int_0^\\infty e^{-x}\\,dx = 1 \\qquad \\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}
$$

## Code

\`\`\`js
function fib(n) {
  return n < 2 ? n : fib(n - 1) + fib(n - 2);
}
\`\`\`

> Everything renders locally in your browser.

[^1]: Footnotes are supported too.
`;

const css = `
.pkt-md { color: var(--text-primary); font-family: var(--font-sans); font-size: var(--text-base); line-height: 1.65; word-wrap: break-word; }
.pkt-md > :first-child { margin-top: 0; }
.pkt-md > :last-child { margin-bottom: 0; }
.pkt-md h1, .pkt-md h2, .pkt-md h3, .pkt-md h4, .pkt-md h5, .pkt-md h6 {
  font-weight: var(--weight-semibold); letter-spacing: var(--tracking-tight);
  line-height: 1.3; margin: 1.6em 0 0.6em; color: var(--text-primary);
}
.pkt-md h1 { font-size: var(--text-2xl); padding-bottom: 0.3em; border-bottom: 1px solid var(--border-default); }
.pkt-md h2 { font-size: var(--text-xl); padding-bottom: 0.3em; border-bottom: 1px solid var(--border-subtle); }
.pkt-md h3 { font-size: var(--text-lg); }
.pkt-md h4 { font-size: var(--text-md); }
.pkt-md h5, .pkt-md h6 { font-size: var(--text-base); color: var(--text-secondary); }
.pkt-md p { margin: 0.7em 0; }
.pkt-md a { color: var(--text-accent); text-decoration: none; }
.pkt-md a:hover { text-decoration: underline; }
.pkt-md ul, .pkt-md ol { margin: 0.7em 0; padding-left: 1.6em; }
.pkt-md li { margin: 0.25em 0; }
.pkt-md li::marker { color: var(--text-tertiary); }
.pkt-md ul.contains-task-list, .pkt-md .task-list-item { list-style: none; }
.pkt-md .task-list-item { margin-left: -1.4em; }
.pkt-md .task-list-item input { margin-right: 0.5em; accent-color: var(--accent); }
.pkt-md blockquote {
  margin: 0.9em 0; padding: 0.2em 0 0.2em 1em;
  border-left: 3px solid var(--border-strong); color: var(--text-secondary);
}
.pkt-md hr { border: none; border-top: 1px solid var(--border-default); margin: 1.6em 0; }
.pkt-md code {
  font-family: var(--font-mono); font-size: 0.88em;
  background: var(--surface-sunken); border: 1px solid var(--border-subtle);
  padding: 0.12em 0.36em; border-radius: var(--radius-sm);
}
.pkt-md pre {
  margin: 0.9em 0; padding: 14px 16px; overflow: auto;
  background: var(--code-bg); border-radius: var(--radius-md);
}
.pkt-md pre code { background: none; border: none; padding: 0; font-size: 13px; color: var(--code-fg); line-height: 1.6; }
.pkt-md table { border-collapse: collapse; margin: 0.9em 0; display: block; overflow-x: auto; }
.pkt-md th, .pkt-md td { border: 1px solid var(--border-default); padding: 6px 11px; }
.pkt-md th { background: var(--surface-sunken); font-weight: var(--weight-semibold); text-align: left; }
.pkt-md img { max-width: 100%; border-radius: var(--radius-md); }
.pkt-md kbd {
  font-family: var(--font-mono); font-size: 0.85em; padding: 0.15em 0.45em;
  background: var(--surface-sunken); border: 1px solid var(--border-default);
  border-bottom-width: 2px; border-radius: var(--radius-sm);
}
.pkt-md .footnotes { margin-top: 2em; padding-top: 1em; border-top: 1px solid var(--border-subtle); font-size: var(--text-sm); color: var(--text-secondary); }
.pkt-md .katex-display { overflow-x: auto; overflow-y: hidden; padding: 4px 0; }
/* highlight.js classes → brand syntax tokens (no external hljs theme) */
.pkt-md .hljs-keyword, .pkt-md .hljs-built_in, .pkt-md .hljs-type, .pkt-md .hljs-keyword { color: var(--syn-keyword); }
.pkt-md .hljs-string, .pkt-md .hljs-attr, .pkt-md .hljs-meta-string { color: var(--syn-string); }
.pkt-md .hljs-number, .pkt-md .hljs-literal { color: var(--syn-number); }
.pkt-md .hljs-comment, .pkt-md .hljs-quote { color: var(--syn-comment); font-style: italic; }
.pkt-md .hljs-title, .pkt-md .hljs-section, .pkt-md .hljs-name, .pkt-md .hljs-selector-id, .pkt-md .hljs-selector-class { color: var(--syn-key); }
.pkt-md .hljs-attribute, .pkt-md .hljs-variable, .pkt-md .hljs-template-variable { color: var(--syn-key); }
.pkt-md .hljs-tag, .pkt-md .hljs-punctuation { color: var(--syn-punct); }
.pkt-md .hljs-meta { color: var(--syn-comment); }

.pkt-md-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 18px 22px; }
.pkt-md-empty { display: grid; place-items: center; flex: 1; color: var(--text-tertiary); font-size: var(--text-sm); }
.pkt-md-drop { outline: 2px dashed var(--accent); outline-offset: -6px; }
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-md")) {
  const s = document.createElement("style"); s.id = "pkt-css-md"; s.textContent = css;
  document.head.appendChild(s);
}

export default function MarkdownPreviewScreen() {
  const [input, setInput] = React.useState(SAMPLE);
  const [view, setView] = React.useState("Split");
  const [dragging, setDragging] = React.useState(false);
  const fileRef = React.useRef(null);

  const deferred = React.useDeferredValue(input);
  const html = React.useMemo(() => render(deferred), [deferred]);

  const readFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setInput(String(reader.result || ""));
    reader.readAsText(file);
  };
  const onPick = (e) => { readFile(e.target.files && e.target.files[0]); e.target.value = ""; };
  const onDrop = (e) => {
    e.preventDefault(); setDragging(false);
    readFile(e.dataTransfer.files && e.dataTransfer.files[0]);
  };

  const showEditor = view !== "Preview";
  const showPreview = view !== "Editor";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <SegmentedControl options={["Split", "Editor", "Preview"]} value={view} onChange={setView} />
        <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <Button variant="secondary" size="sm" icon="upload" onClick={() => fileRef.current && fileRef.current.click()}>Import .md</Button>
          <Button variant="ghost" size="sm" icon="rotate-ccw" onClick={() => setInput(SAMPLE)}>Sample</Button>
        </span>
        <input ref={fileRef} type="file" accept=".md,.markdown,.mdx,.txt,text/markdown,text/plain"
          style={{ display: "none" }} onChange={onPick} />
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: showEditor && showPreview ? "1fr 1fr" : "1fr", gap: 14 }}>
        {showEditor ? (
          <div style={{ display: "flex", minHeight: 0 }}
            className={dragging ? "pkt-md-drop" : undefined}
            onDragOver={(e) => { e.preventDefault(); if (!dragging) setDragging(true); }}
            onDragLeave={(e) => { if (e.currentTarget === e.target) setDragging(false); }}
            onDrop={onDrop}>
            <Panel title="Markdown" variant="sunken" meta={input.length.toLocaleString() + " chars"}
              actions={<IconButton icon="x" label="Clear" size="sm" onClick={() => setInput("")} />}
              style={{ flex: 1, minWidth: 0 }}>
              <Textarea bare value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="Type or drop a .md file here…" style={{ flex: 1, padding: "12px 14px", minHeight: 0 }} />
            </Panel>
          </div>
        ) : null}

        {showPreview ? (
          <Panel title="Preview" variant="raised"
            actions={html ? <CopyButton getText={() => html} label="Copy HTML" /> : null}>
            {html ? (
              <div className="pkt-md-scroll">
                <div className="pkt-md" dangerouslySetInnerHTML={{ __html: html }} />
              </div>
            ) : (
              <div className="pkt-md-empty">Nothing to preview yet. Type Markdown or import a file.</div>
            )}
          </Panel>
        ) : null}
      </div>
    </div>
  );
}
