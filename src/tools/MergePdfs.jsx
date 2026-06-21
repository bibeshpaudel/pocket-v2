// Pocket — Merge PDFs. Combine and reorder multiple PDFs into one with pdf-lib,
// fully client-side (files never leave the browser). DS primitives + tokens only.
import React from "react";
import { PDFDocument } from "pdf-lib";
import { Panel } from "../../Pocket Design System/components/surfaces/Panel.jsx";
import { Badge } from "../../Pocket Design System/components/core/Badge.jsx";
import { Button } from "../../Pocket Design System/components/core/Button.jsx";
import { IconButton } from "../../Pocket Design System/components/core/IconButton.jsx";
import { EmptyState } from "../../Pocket Design System/components/surfaces/EmptyState.jsx";
import { Icon } from "../../Pocket Design System/components/core/Icon.jsx";
import { Dropzone, readArrayBuffer, downloadBlob, formatBytes } from "./file-shared.jsx";

let nextId = 1;

export default function MergePdfsScreen() {
  const [items, setItems] = React.useState([]); // { id, name, size, bytes, pages, error }
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState(null);

  const add = React.useCallback(async (files) => {
    setError(null);
    const pdfs = files.filter((f) => /\.pdf$/i.test(f.name) || f.type === "application/pdf");
    if (!pdfs.length) { setError("Please choose PDF files."); return; }
    const loaded = await Promise.all(pdfs.map(async (f) => {
      try {
        const buf = await readArrayBuffer(f);
        const bytes = new Uint8Array(buf);
        const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        return { id: nextId++, name: f.name, size: f.size, bytes, pages: doc.getPageCount() };
      } catch (e) {
        return { id: nextId++, name: f.name, size: f.size, bytes: null, pages: 0, error: "Unreadable / encrypted" };
      }
    }));
    setItems((prev) => prev.concat(loaded));
  }, []);

  const move = (i, d) => setItems((prev) => { const a = prev.slice(); const j = i + d; if (j < 0 || j >= a.length) return prev; [a[i], a[j]] = [a[j], a[i]]; return a; });
  const remove = (id) => setItems((prev) => prev.filter((x) => x.id !== id));

  const usable = items.filter((x) => x.bytes);
  const totalPages = usable.reduce((n, x) => n + x.pages, 0);

  const merge = async () => {
    if (usable.length < 1) return;
    setBusy(true); setError(null);
    try {
      const out = await PDFDocument.create();
      for (const item of usable) {
        const src = await PDFDocument.load(item.bytes, { ignoreEncryption: true });
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      }
      const bytes = await out.save();
      downloadBlob(new Blob([bytes], { type: "application/pdf" }), "merged.pdf");
    } catch (e) {
      setError((e && e.message) || "Merge failed.");
    } finally { setBusy(false); }
  };

  if (!items.length) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
        <Dropzone onFiles={add} accept=".pdf,application/pdf" multiple icon="files"
          title="Drop PDFs to merge" hint="Add two or more PDFs — combined locally, nothing uploaded" />
        {error ? <div style={{ fontSize: 13, color: "var(--danger)" }}>{error}</div> : null}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{usable.length} file{usable.length === 1 ? "" : "s"} · {totalPages} pages total</span>
        <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <label>
            <input type="file" accept=".pdf,application/pdf" multiple onChange={(e) => { add(Array.from(e.target.files)); e.target.value = ""; }} style={{ display: "none" }} />
            <Button variant="secondary" size="sm" icon="plus" onClick={(e) => e.currentTarget.previousSibling.click()}>Add more</Button>
          </label>
          <Button variant="ghost" size="sm" icon="x" onClick={() => setItems([])}>Clear</Button>
          <Button variant="primary" size="sm" icon="download" disabled={busy || !usable.length} onClick={merge}>{busy ? "Merging…" : "Merge & download"}</Button>
        </span>
      </div>

      <Panel title="Order" variant="sunken" meta={<Badge kind="neutral">drag-free reorder ↑ ↓</Badge>} style={{ flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((it, i) => (
            <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "var(--surface-raised)", border: "1px solid " + (it.error ? "var(--danger)" : "var(--border-default)"), borderRadius: "var(--radius-md)" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-tertiary)", width: 22, textAlign: "right", flex: "none" }}>{i + 1}</span>
              <Icon name="file-text" size={16} style={{ color: "var(--text-tertiary)", flex: "none" }} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.name}</span>
              {it.error
                ? <Badge kind="danger">{it.error}</Badge>
                : <span style={{ fontSize: 12, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", flex: "none" }}>{it.pages} pg · {formatBytes(it.size)}</span>}
              <span style={{ display: "flex", gap: 2, flex: "none" }}>
                <IconButton icon="chevron-up" label="Move up" size="sm" disabled={i === 0} onClick={() => move(i, -1)} />
                <IconButton icon="chevron-down" label="Move down" size="sm" disabled={i === items.length - 1} onClick={() => move(i, 1)} />
                <IconButton icon="trash-2" label="Remove" size="sm" onClick={() => remove(it.id)} />
              </span>
            </div>
          ))}
        </div>
      </Panel>
      {error ? <div style={{ fontSize: 13, color: "var(--danger)" }}>{error}</div> : null}
    </div>
  );
}
