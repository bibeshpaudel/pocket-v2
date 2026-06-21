// Pocket — PDF to Text. Extracts the text layer from a PDF with pdf.js, fully
// client-side (the file never leaves the browser). Scanned/image-only PDFs have
// no text layer to extract. DS primitives + tokens only.
import React from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Panel } from "../../Pocket Design System/components/surfaces/Panel.jsx";
import { Textarea } from "../../Pocket Design System/components/forms/Textarea.jsx";
import { Badge } from "../../Pocket Design System/components/core/Badge.jsx";
import { Button } from "../../Pocket Design System/components/core/Button.jsx";
import { Switch } from "../../Pocket Design System/components/forms/Switch.jsx";
import { CopyButton } from "../../Pocket Design System/components/core/CopyButton.jsx";
import { Dropzone, readArrayBuffer, downloadText, formatBytes } from "./file-shared.jsx";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

async function extract(buffer, { pageMarkers }) {
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const pages = [];
  for (let p = 1; p <= numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    let lastY = null, line = "", out = "";
    for (const item of content.items) {
      if (!("str" in item)) continue;
      const y = item.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 2) { out += line.trimEnd() + "\n"; line = ""; }
      line += item.str + (item.hasEOL ? "\n" : "");
      lastY = y;
    }
    out += line.trimEnd();
    pages.push(out.replace(/\n{3,}/g, "\n\n").trim());
  }
  try { await loadingTask.destroy(); } catch (e) { /* ignore */ }
  const body = pageMarkers
    ? pages.map((t, i) => `──── Page ${i + 1} ────\n${t}`).join("\n\n")
    : pages.join("\n\n");
  return { text: body, numPages, chars: body.length };
}

export default function PdfToTextScreen() {
  const [file, setFile] = React.useState(null);
  const [pageMarkers, setPageMarkers] = React.useState(true);
  const [state, setState] = React.useState({ status: "idle" }); // idle | working | done | error

  const open = React.useCallback(async (f, markers) => {
    setFile(f); setState({ status: "working" });
    try {
      const buf = await readArrayBuffer(f);
      const r = await extract(buf, { pageMarkers: markers });
      setState({ status: "done", ...r });
    } catch (e) {
      setState({ status: "error", message: (e && e.message) || "Could not read this PDF." });
    }
  }, []);

  // Re-extract when the page-marker option changes.
  const onToggleMarkers = (v) => { setPageMarkers(v); if (file) open(file, v); };

  if (!file) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
        <Dropzone onFiles={(fs) => open(fs[0], pageMarkers)} accept=".pdf,application/pdf" icon="file-text"
          title="Drop a PDF to extract its text" hint="Reads the embedded text layer locally — nothing is uploaded" />
      </div>
    );
  }

  const text = state.status === "done" ? state.text : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Badge kind="neutral">{file.name}</Badge>
        <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
          {formatBytes(file.size)}{state.status === "done" ? ` · ${state.numPages} pages · ${state.chars.toLocaleString()} chars` : ""}
        </span>
        <Switch checked={pageMarkers} onChange={onToggleMarkers} label="Page markers" />
        <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Button variant="primary" size="sm" icon="download" disabled={state.status !== "done" || !text}
            onClick={() => downloadText(text, file.name.replace(/\.pdf$/i, "") + ".txt")}>Download .txt</Button>
          <Button variant="secondary" size="sm" icon="file-up" onClick={() => { setFile(null); setState({ status: "idle" }); }}>New PDF</Button>
        </span>
      </div>

      <Panel title="Extracted text" variant="code" style={{ flex: 1, minHeight: 0 }}
        meta={state.status === "working" ? <span style={{ fontSize: 12, color: "var(--syn-comment)" }}>extracting…</span>
          : state.status === "error" ? <Badge kind="danger">Failed</Badge>
          : text ? <Badge kind="ok" dot>Done</Badge>
          : state.status === "done" ? <Badge kind="warn">No text layer</Badge> : null}
        actions={text ? <CopyButton onDark getText={() => text} /> : null}>
        {state.status === "error" ? (
          <div style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: 13, color: "#E08A76" }}>{state.message}</div>
        ) : state.status === "done" && !text ? (
          <div style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--syn-comment)" }}>
            No extractable text — this looks like a scanned / image-only PDF. (OCR isn't supported.)
          </div>
        ) : (
          <Textarea bare value={text} readOnly placeholder={state.status === "working" ? "Extracting…" : ""}
            style={{ flex: 1, padding: "12px 16px", minHeight: 0, color: "var(--code-fg)" }} />
        )}
      </Panel>
    </div>
  );
}
