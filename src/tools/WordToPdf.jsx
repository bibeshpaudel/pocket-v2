// Pocket — Word to PDF. Converts .docx to clean HTML with mammoth (client-side),
// previews it, and produces a PDF via the browser's print engine (high-fidelity,
// selectable text). The file never leaves the browser. DS primitives + tokens.
import React from "react";
import mammoth from "mammoth/mammoth.browser.js";
import { downloadDocxPdf } from "./docx-pdf.js";
import { Panel } from "../../Pocket Design System/components/surfaces/Panel.jsx";
import { Badge } from "../../Pocket Design System/components/core/Badge.jsx";
import { Button } from "../../Pocket Design System/components/core/Button.jsx";
import { Icon } from "../../Pocket Design System/components/core/Icon.jsx";
import { Dropzone, readArrayBuffer, downloadText, formatBytes } from "./file-shared.jsx";

// Shared document styling, scoped to the preview wrapper.
const DOC_RULES = `
  font-family: Georgia, "Times New Roman", serif; font-size: 12pt; line-height: 1.55; color: #1a1a1a;
`;
const PREVIEW_CSS = `
.docx-page, .docx-page * { color: #1a1a1a !important; }
.docx-page a, .docx-page a * { color: #1155cc !important; }
.docx-page { ${DOC_RULES} }
.docx-page h1, .docx-page h2, .docx-page h3, .docx-page h4 { font-family: Arial, Helvetica, sans-serif; line-height: 1.25; margin: 1.2em 0 0.5em; }
.docx-page h1 { font-size: 1.8em; } .docx-page h2 { font-size: 1.4em; } .docx-page h3 { font-size: 1.15em; }
.docx-page p { margin: 0 0 0.8em; }
.docx-page img { max-width: 100%; height: auto; }
.docx-page table { border-collapse: collapse; margin: 1em 0; width: 100%; }
.docx-page td, .docx-page th { border: 1px solid #999; padding: 5px 9px; vertical-align: top; }
.docx-page ul, .docx-page ol { margin: 0 0 0.8em 1.4em; }
.docx-page a { color: #1155cc; }
`;
const PRINT_CSS = `
  @page { margin: 18mm; }
  body { ${DOC_RULES} margin: 0; }
  h1, h2, h3, h4 { font-family: Arial, Helvetica, sans-serif; line-height: 1.25; }
  img { max-width: 100%; height: auto; }
  table { border-collapse: collapse; width: 100%; } td, th { border: 1px solid #999; padding: 5px 9px; }
  ul, ol { margin-left: 1.2em; } a { color: #1155cc; }
`;

function printToPdf(html, title) {
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>${PRINT_CSS}</style></head><body>${html}</body></html>`);
  doc.close();
  const go = () => {
    try { iframe.contentWindow.focus(); iframe.contentWindow.print(); } catch (e) { /* ignore */ }
    setTimeout(() => iframe.remove(), 1500);
  };
  // give images/fonts a moment to lay out before printing
  setTimeout(go, 400);
}

export default function WordToPdfScreen() {
  const [file, setFile] = React.useState(null);
  const [state, setState] = React.useState({ status: "idle" }); // idle | working | done | error
  const [downloading, setDownloading] = React.useState(false);

  const downloadPdf = async () => {
    if (state.status !== "done") return;
    setDownloading(true);
    try { await downloadDocxPdf(state.html, file.name.replace(/\.docx$/i, "") + ".pdf"); }
    catch (e) { /* ignore */ } finally { setDownloading(false); }
  };

  const open = React.useCallback(async (f) => {
    if (!/\.docx$/i.test(f.name)) { setState({ status: "error", message: "Please choose a .docx file. The legacy .doc format isn't supported." }); setFile(f); return; }
    setFile(f); setState({ status: "working" });
    try {
      const arrayBuffer = await readArrayBuffer(f);
      const result = await mammoth.convertToHtml({ arrayBuffer });
      setState({ status: "done", html: result.value || "<p><em>(empty document)</em></p>", warnings: (result.messages || []).length });
    } catch (e) {
      setState({ status: "error", message: (e && e.message) || "Could not convert this document." });
    }
  }, []);

  if (!file) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
        <Dropzone onFiles={(fs) => open(fs[0])} accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          icon="file-type" title="Drop a Word document (.docx)" hint="Converted locally — nothing is uploaded" />
      </div>
    );
  }

  const html = state.status === "done" ? state.html : "";
  const base = file.name.replace(/\.docx$/i, "");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Badge kind="neutral">{file.name}</Badge>
        <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{formatBytes(file.size)}</span>
        {state.status === "done" && state.warnings ? <Badge kind="warn">{state.warnings} conversion note{state.warnings === 1 ? "" : "s"}</Badge> : null}
        <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Button variant="secondary" size="sm" icon="code" disabled={!html} onClick={() => downloadText(`<!doctype html><meta charset="utf-8"><style>${PRINT_CSS}</style>` + html, base + ".html", "text/html")}>HTML</Button>
          <Button variant="secondary" size="sm" icon="printer" disabled={!html} onClick={() => printToPdf(html, base)}>Print</Button>
          <Button variant="primary" size="sm" icon="download" disabled={!html || downloading} onClick={downloadPdf}>{downloading ? "Building…" : "Download PDF"}</Button>
          <Button variant="ghost" size="sm" icon="file-up" onClick={() => { setFile(null); setState({ status: "idle" }); }}>New file</Button>
        </span>
      </div>

      <div style={{ fontSize: 12, color: "var(--text-tertiary)", display: "flex", alignItems: "flex-start", gap: 8 }}>
        <Icon name="info" size={12} style={{ marginTop: 2, flex: "none" }} /> <span><strong>Tip:</strong> for the best-looking result, use <strong>Print</strong> and choose “Save as PDF” in the dialog — it preserves complex layout, images and page breaks most faithfully. <strong>Download PDF</strong> is a quick one-click option that produces a text-selectable file, but layout fidelity can be lower.</span>
      </div>

      <Panel title="Preview" variant="sunken" style={{ flex: 1, minHeight: 0 }}
        meta={state.status === "working" ? <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>converting…</span>
          : state.status === "error" ? <Badge kind="danger">Failed</Badge>
          : html ? <Badge kind="ok" dot>Converted</Badge> : null}>
        {state.status === "error" ? (
          <div style={{ padding: "16px", fontFamily: "var(--font-mono)", fontSize: 13, color: "#E08A76" }}>{state.message}</div>
        ) : (
          <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "24px", display: "flex", justifyContent: "center" }}>
            <div style={{ width: "100%", maxWidth: 820, background: "#ffffff", color: "#1a1a1a", padding: "48px 56px", borderRadius: "var(--radius-sm)", border: "1px solid rgba(0,0,0,0.12)", boxShadow: "0 4px 24px rgba(0,0,0,0.28)", colorScheme: "light" }}>
              <style dangerouslySetInnerHTML={{ __html: PREVIEW_CSS }} />
              <div className="docx-page" dangerouslySetInnerHTML={{ __html: html || "<p style='color:#999'>Converting…</p>" }} />
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
