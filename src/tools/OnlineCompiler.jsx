// Pocket — Online Compiler. JavaScript runs locally in a sandboxed Web Worker;
// Python runs locally via Pyodide (CPython→WASM, runtime fetched once from a CDN);
// C++ is compiled/run on the public Wandbox service (wandbox.org) — code for C++
// leaves the browser, shown with a notice. DS primitives + tokens only.
import React from "react";
import { Panel } from "../../Pocket Design System/components/surfaces/Panel.jsx";
import { Textarea } from "../../Pocket Design System/components/forms/Textarea.jsx";
import { Badge } from "../../Pocket Design System/components/core/Badge.jsx";
import { Button } from "../../Pocket Design System/components/core/Button.jsx";
import { IconButton } from "../../Pocket Design System/components/core/IconButton.jsx";
import { CopyButton } from "../../Pocket Design System/components/core/CopyButton.jsx";
import { Select } from "../../Pocket Design System/components/forms/Select.jsx";
import { Icon } from "../../Pocket Design System/components/core/Icon.jsx";

const SAMPLES = {
  javascript: `// JavaScript runs locally in a sandboxed Web Worker.
const fib = (n) => (n < 2 ? n : fib(n - 1) + fib(n - 2));
for (let i = 0; i < 10; i++) console.log(\`fib(\${i}) =\`, fib(i));

console.log("sorted:", [5, 3, 1, 4, 2].sort((a, b) => a - b));
`,
  python: `# Python runs locally via Pyodide (CPython compiled to WebAssembly).
import sys

def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a

print("Python", sys.version.split()[0])
print([fib(i) for i in range(10)])
`,
  cpp: `// C++ is compiled & run on the public Piston API (see the notice above).
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    vector<int> v = {3, 1, 2, 5, 4};
    sort(v.begin(), v.end());
    for (int x : v) cout << x << " ";
    cout << "\\n";
    return 0;
}
`,
};

SAMPLES.web = `<!doctype html>
<html>
<head>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; color: #1a1208; }
    h1 { color: #b45309; }
    button { font: inherit; padding: 6px 12px; cursor: pointer; }
  </style>
</head>
<body>
  <h1>Hello from the web</h1>
  <button id="btn">Click me</button>
  <p id="out"></p>
  <script>
    console.log("Page loaded — logs show in the Console panel below.");
    let n = 0;
    document.getElementById("btn").onclick = () => {
      n++;
      document.getElementById("out").textContent = "Clicked " + n + " time(s)";
      console.log("button clicked", n);
    };
  </script>
</body>
</html>
`;
SAMPLES.typescript = `const square = (n: number): number => n * n;
console.log("Hello from TypeScript");
console.log([1, 2, 3, 4, 5].map(square).join(" "));
`;
SAMPLES.c = `#include <stdio.h>
int main(void) {
    printf("Hello from C\\n");
    for (int i = 1; i <= 5; i++) printf("%d ", i * i);
    printf("\\n");
    return 0;
}
`;
SAMPLES.csharp = `using System;
using System.Linq;

class Program {
    static void Main() {
        Console.WriteLine("Hello from C#");
        Console.WriteLine(string.Join(" ", Enumerable.Range(1, 5).Select(i => i * i)));
    }
}
`;
SAMPLES.java = `class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java");
        for (int i = 1; i <= 5; i++) System.out.print(i * i + " ");
    }
}
`;
SAMPLES.go = `package main

import "fmt"

func main() {
    fmt.Println("Hello from Go")
    for i := 1; i <= 5; i++ {
        fmt.Print(i*i, " ")
    }
}
`;
SAMPLES.rust = `fn main() {
    println!("Hello from Rust");
    for i in 1..=5 {
        print!("{} ", i * i);
    }
}
`;
SAMPLES.ruby = `puts "Hello from Ruby"
puts (1..5).map { |i| i * i }.join(" ")
`;
SAMPLES.php = `<?php
echo "Hello from PHP\\n";
echo implode(" ", array_map(fn($i) => $i * $i, range(1, 5)));
`;
SAMPLES.bash = `echo "Hello from Bash"
for i in 1 2 3 4 5; do echo -n "$((i * i)) "; done
echo
`;

const LANGS = {
  web: { label: "Web (HTML/CSS/JS)", mode: "web", via: "Sandboxed iframe (local)" },
  javascript: { label: "JavaScript", mode: "local", via: "Web Worker (local)" },
  typescript: { label: "TypeScript", mode: "remote", compiler: "typescript-5.6.2", via: "Wandbox (remote)" },
  python: { label: "Python", mode: "pyodide", via: "Pyodide (local)" },
  c: { label: "C", mode: "remote", compiler: "gcc-13.2.0-c", options: "warning", via: "Wandbox (remote)" },
  cpp: { label: "C++", mode: "remote", compiler: "gcc-13.2.0", options: "warning,gnu++2b", via: "Wandbox (remote)" },
  csharp: { label: "C#", mode: "remote", compiler: "mono-6.12.0.199", via: "Wandbox (remote)" },
  java: { label: "Java", mode: "remote", compiler: "openjdk-jdk-22+36", via: "Wandbox (remote)" },
  go: { label: "Go", mode: "remote", compiler: "go-1.23.2", via: "Wandbox (remote)" },
  rust: { label: "Rust", mode: "remote", compiler: "rust-1.82.0", via: "Wandbox (remote)" },
  ruby: { label: "Ruby", mode: "remote", compiler: "ruby-3.4.9", via: "Wandbox (remote)" },
  php: { label: "PHP", mode: "remote", compiler: "php-8.3.12", via: "Wandbox (remote)" },
  bash: { label: "Bash", mode: "remote", compiler: "bash", via: "Wandbox (remote)" },
};

// ---- Web preview: console capture ----------------------------------------
// The preview iframe is sandboxed (allow-scripts, no allow-same-origin) so we
// can't read its console directly — instead we inject a shim that forwards
// console.* and errors to the parent via postMessage.
const CONSOLE_PROBE =
  "<script>(function(){" +
  "var send=function(l,a){try{parent.postMessage({__pocketConsole:true,level:l,text:Array.prototype.map.call(a,function(x){if(typeof x==='string')return x;try{return JSON.stringify(x);}catch(e){return String(x);}}).join(' ')},'*');}catch(e){}};" +
  "['log','info','debug','warn','error'].forEach(function(k){var o=console[k]?console[k].bind(console):function(){};console[k]=function(){send(k,arguments);o.apply(console,arguments);};});" +
  "window.addEventListener('error',function(e){send('error',[e.message+(e.filename?' ('+e.lineno+':'+e.colno+')':'')]);});" +
  "window.addEventListener('unhandledrejection',function(e){send('error',['Unhandled rejection: '+((e.reason&&e.reason.message)||e.reason)]);});" +
  "})();</" + "script>";

function injectProbe(html) {
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, (m) => m + CONSOLE_PROBE);
  if (/<body[^>]*>/i.test(html)) return html.replace(/<body[^>]*>/i, (m) => m + CONSOLE_PROBE);
  return CONSOLE_PROBE + html;
}

// ---- JavaScript: sandboxed worker ----------------------------------------

const JS_WORKER = `
const logs = [];
const fmt = (args) => args.map((x) => {
  if (typeof x === "string") return x;
  try { return JSON.stringify(x); } catch (e) { return String(x); }
}).join(" ");
["log","info","debug","warn","error"].forEach((k) => { self.console[k] = (...a) => logs.push({ k, t: fmt(a) }); });
self.onmessage = async (e) => {
  const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
  try {
    await new AsyncFunction(e.data)();
    self.postMessage({ ok: true, logs });
  } catch (err) {
    self.postMessage({ ok: false, logs, error: (err && err.stack) ? String(err.stack) : String(err) });
  }
};
`;

function runJs(code) {
  return new Promise((resolve) => {
    let worker;
    try { worker = new Worker(URL.createObjectURL(new Blob([JS_WORKER], { type: "text/javascript" }))); }
    catch (e) { resolve({ lines: [{ stream: "err", text: "Could not start the sandbox worker." }], error: true }); return; }
    const timer = setTimeout(() => { worker.terminate(); resolve({ lines: [{ stream: "err", text: "Timed out after 5s (possible infinite loop)." }], error: true }); }, 5000);
    worker.onmessage = (e) => {
      clearTimeout(timer); worker.terminate();
      const { logs, ok, error } = e.data;
      const lines = logs.map((l) => ({ stream: l.k === "error" || l.k === "warn" ? "err" : "out", text: l.t }));
      if (!ok) lines.push({ stream: "err", text: error });
      resolve({ lines, error: !ok });
    };
    worker.onerror = (e) => { clearTimeout(timer); worker.terminate(); resolve({ lines: [{ stream: "err", text: String(e.message || e) }], error: true }); };
    worker.postMessage(code);
  });
}

// ---- Python: Pyodide ------------------------------------------------------

const PYODIDE_BASE = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";
let pyodidePromise = null;
function getPyodide() {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      const mod = await import(/* @vite-ignore */ PYODIDE_BASE + "pyodide.mjs");
      return mod.loadPyodide({ indexURL: PYODIDE_BASE });
    })().catch((e) => { pyodidePromise = null; throw e; });
  }
  return pyodidePromise;
}
async function runPython(code, stdin) {
  const py = await getPyodide();
  const lines = [];
  py.setStdout({ batched: (s) => lines.push({ stream: "out", text: s }) });
  py.setStderr({ batched: (s) => lines.push({ stream: "err", text: s }) });
  let fed = false;
  py.setStdin({ stdin: () => { if (fed) return null; fed = true; return stdin || ""; } });
  try {
    await py.runPythonAsync(code);
    return { lines, error: false };
  } catch (err) {
    lines.push({ stream: "err", text: String(err && err.message ? err.message : err) });
    return { lines, error: true };
  }
}

// ---- C++ (and friends): Wandbox ------------------------------------------
// (The public Piston API went whitelist-only in Feb 2026; Wandbox is free,
//  key-less and CORS-enabled.)

const WANDBOX = "https://wandbox.org/api/compile.json";

async function runWandbox(lang, code, stdin) {
  const res = await fetch(WANDBOX, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ compiler: lang.compiler, code, stdin: stdin || "", options: lang.options || "", "compiler-option-raw": "", "runtime-option-raw": "" }),
  });
  if (res.status === 429) throw new Error("Rate limited by Wandbox — wait a moment and retry.");
  if (!res.ok) throw new Error("Execution server error (" + res.status + ").");
  const d = await res.json();
  const lines = []; let error = false;
  if (d.compiler_error) lines.push({ stream: "err", text: d.compiler_error.replace(/\s+$/, "") }); // compile diagnostics
  if (d.program_output) lines.push({ stream: "out", text: d.program_output.replace(/\n$/, "") });
  if (d.program_error) lines.push({ stream: "err", text: d.program_error.replace(/\n$/, "") });
  const exit = d.status != null ? Number(d.status) : null;
  if (exit) error = true;
  if (d.signal) { lines.push({ stream: "err", text: "Terminated by signal: " + d.signal }); error = true; }
  return { lines, error, exitCode: exit, version: lang.compiler };
}

// ---------------------------------------------------------------------------

export default function OnlineCompilerScreen() {
  const [lang, setLang] = React.useState("web");
  const [codes, setCodes] = React.useState({ ...SAMPLES });
  const [stdin, setStdin] = React.useState("");
  const [showStdin, setShowStdin] = React.useState(false);
  const [running, setRunning] = React.useState(false);
  const [result, setResult] = React.useState(null); // { lines, error, ms, via, exitCode }
  const [status, setStatus] = React.useState(null); // transient status text
  const [iframeKey, setIframeKey] = React.useState(0); // force-reload web preview
  const [webSrc, setWebSrc] = React.useState(SAMPLES.web); // debounced HTML actually rendered
  const [webLogs, setWebLogs] = React.useState([]); // console output from the preview iframe

  const meta = LANGS[lang];
  const code = codes[lang];
  const setCode = (v) => setCodes((c) => ({ ...c, [lang]: v }));

  // Debounce the web preview so it doesn't reload on every keystroke.
  React.useEffect(() => {
    if (meta.mode !== "web") return undefined;
    const h = setTimeout(() => setWebSrc(codes.web), 350);
    return () => clearTimeout(h);
  }, [codes.web, meta.mode]);

  // Reset captured console output whenever the preview re-renders.
  React.useEffect(() => { setWebLogs([]); }, [webSrc, iframeKey]);

  // Listen for console messages forwarded from the sandboxed iframe.
  React.useEffect(() => {
    const onMsg = (e) => { if (e.data && e.data.__pocketConsole) setWebLogs((l) => l.concat({ stream: e.data.level === "warn" || e.data.level === "error" ? "err" : "out", text: e.data.text })); };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const run = React.useCallback(async () => {
    if (running) return;
    if (meta.mode === "web") { setWebSrc(codes.web); setIframeKey((k) => k + 1); return; } // reload preview now
    setRunning(true); setResult(null);
    const started = Date.now();
    try {
      let r;
      if (meta.mode === "local") { setStatus("Running in worker…"); r = await runJs(codes[lang]); }
      else if (meta.mode === "pyodide") { setStatus(pyodidePromise ? "Running…" : "Loading Python runtime (first run only)…"); r = await runPython(codes[lang], stdin); }
      else { setStatus("Compiling on Wandbox…"); r = await runWandbox(meta, codes[lang], stdin); }
      setResult({ ...r, ms: Date.now() - started, via: meta.via + (r.version ? " · " + r.version : "") });
    } catch (e) {
      setResult({ lines: [{ stream: "err", text: (e && e.message) || String(e) }], error: true, ms: Date.now() - started, via: meta.via });
    } finally { setRunning(false); setStatus(null); }
  }, [running, meta, codes, lang, stdin]);

  const onEditorKey = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); run(); return; }
    if (e.key === "Tab") {
      e.preventDefault();
      const t = e.target, s = t.selectionStart, en = t.selectionEnd;
      const next = code.slice(0, s) + "  " + code.slice(en);
      setCode(next);
      requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = s + 2; });
    }
  };

  const outMeta = result ? (
    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11 }}>{result.via} · {result.ms}ms</span>
      <Badge kind={result.error ? "danger" : "ok"} dot>{result.error ? (result.exitCode != null ? "exit " + result.exitCode : "error") : "ok"}</Badge>
    </span>
  ) : running ? <span style={{ fontSize: 12, color: "var(--syn-comment)" }}>{status || "running…"}</span> : null;

  const outputText = result ? result.lines.map((l) => l.text).join("\n") : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Select value={lang} onChange={(e) => { setLang(e.target.value); setResult(null); }}
          options={Object.entries(LANGS).map(([k, v]) => ({ value: k, label: v.label }))} />
        <Button variant="primary" icon={running ? "loader" : meta.mode === "web" ? "refresh-cw" : "play"} onClick={run} disabled={running}>
          {running ? "Running…" : meta.mode === "web" ? "Reload" : "Run"}
        </Button>
        <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>⌘/Ctrl + Enter</span>
        <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {meta.mode === "remote" || meta.mode === "pyodide" ? (
            <Button variant="ghost" size="sm" icon="terminal-square" onClick={() => setShowStdin((s) => !s)}>{showStdin ? "Hide stdin" : "stdin"}</Button>
          ) : null}
          <Button variant="ghost" size="sm" icon="rotate-ccw" onClick={() => setCode(SAMPLES[lang])}>Sample</Button>
        </span>
      </div>

      {meta.mode === "remote" ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", background: "var(--warn-soft)", border: "1px solid var(--warn)", borderRadius: "var(--radius-md)" }}>
          <Icon name="cloud-upload" size={15} style={{ color: "var(--warn)", flex: "none" }} />
          <span style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>
            <strong>{meta.label}</strong> is compiled and run on the public <strong>Wandbox</strong> service (wandbox.org). Your code and stdin are sent to that server — don't run anything sensitive.
          </span>
        </div>
      ) : null}

      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
          <Panel title={meta.label + " source"} variant="sunken" meta={code.split("\n").length + " lines"}
            actions={<IconButton icon="x" label="Clear" size="sm" onClick={() => setCode("")} />}
            style={{ flex: 1, minHeight: 0 }}>
            <Textarea bare mono value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={onEditorKey}
              placeholder="Write some code…" style={{ flex: 1, padding: "12px 14px", minHeight: 0 }} />
          </Panel>
          {showStdin && meta.mode !== "web" ? (
            <Panel title="Standard input (stdin)" variant="sunken" style={{ flex: "none" }}>
              <Textarea bare mono value={stdin} onChange={(e) => setStdin(e.target.value)} rows={3}
                placeholder="Fed to the program's stdin…" style={{ padding: "10px 14px", minHeight: 0 }} />
            </Panel>
          ) : null}
        </div>

        {meta.mode === "web" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
            <Panel title="Preview" variant="sunken" meta={<Badge kind="ok" dot>live</Badge>} style={{ flex: 1, minHeight: 0 }}>
              <iframe key={iframeKey} title="Web preview" sandbox="allow-scripts allow-modals" srcDoc={injectProbe(webSrc)}
                style={{ flex: 1, minHeight: 0, width: "100%", border: "none", background: "#ffffff" }} />
            </Panel>
            <Panel title="Console" variant="code" style={{ flex: "none", height: "34%" }}
              meta={webLogs.length ? <Badge kind="neutral">{webLogs.length}</Badge> : null}
              actions={webLogs.length ? <CopyButton onDark getText={() => webLogs.map((l) => l.text).join("\n")} /> : null}>
              <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "10px 16px", fontFamily: "var(--font-mono)", fontSize: 12.5, lineHeight: 1.6 }}>
                {webLogs.length ? webLogs.map((l, i) => (
                  <div key={i} style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", color: l.stream === "err" ? "#E08A76" : "var(--code-fg)" }}>{l.text}</div>
                )) : <span style={{ color: "var(--syn-comment)" }}>console.log() output from your page appears here.</span>}
              </div>
            </Panel>
          </div>
        ) : (
          <Panel title="Output" variant="code" meta={outMeta}
            actions={result && outputText ? <CopyButton onDark getText={() => outputText} /> : null}>
            <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "12px 16px", fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.6 }}>
              {result ? (
                result.lines.length ? result.lines.map((l, i) => (
                  <div key={i} style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", color: l.stream === "err" ? "#E08A76" : "var(--code-fg)" }}>{l.text}</div>
                )) : <span style={{ color: "var(--syn-comment)" }}>(no output)</span>
              ) : (
                <span style={{ color: "var(--syn-comment)" }}>{running ? (status || "Running…") : "Press Run (or ⌘/Ctrl + Enter) to execute."}</span>
              )}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
