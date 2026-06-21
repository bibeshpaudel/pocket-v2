// Pocket — render mammoth's DOCX HTML to a real, text-selectable PDF with jsPDF.
// Unlike html2canvas/rasterized export, text stays selectable and pagination
// happens on whole lines (never sliced mid-glyph). Handles headings, paragraphs,
// inline bold/italic/links, lists, blockquotes, rules, images, code and tables.
import { jsPDF } from "jspdf";

export async function downloadDocxPdf(html, filename) {
  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });
  const M = 54;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const maxW = pageW - M * 2;
  const bottom = pageH - M;
  const topBaseline = M + 16;
  let y = topBaseline;

  const root = new DOMParser().parseFromString(html, "text/html").body;

  // Preload images so the layout pass can stay synchronous.
  const imgMap = new Map();
  await Promise.all(Array.from(root.querySelectorAll("img")).map((el) => new Promise((res) => {
    const src = el.getAttribute("src"); if (!src) return res();
    const im = new Image();
    im.onload = () => { imgMap.set(el, { w: im.naturalWidth, h: im.naturalHeight, src }); res(); };
    im.onerror = () => res();
    im.src = src;
  })));

  const newPage = () => { doc.addPage(); y = topBaseline; };
  const need = (h) => { if (y + h > bottom) newPage(); };

  function collectRuns(node, style) {
    let runs = [];
    node.childNodes.forEach((ch) => {
      if (ch.nodeType === 3) { const t = ch.textContent.replace(/\s+/g, " "); if (t) runs.push({ text: t, ...style }); }
      else if (ch.nodeType === 1) {
        const tag = ch.tagName.toLowerCase();
        if (tag === "br") { runs.push({ br: true }); return; }
        const s = { ...style };
        if (tag === "strong" || tag === "b") s.bold = true;
        if (tag === "em" || tag === "i") s.italic = true;
        if (tag === "a") s.link = true;
        runs = runs.concat(collectRuns(ch, s));
      }
    });
    return runs;
  }

  function fontStyle(r) { return r.bold && r.italic ? "bolditalic" : r.bold ? "bold" : r.italic ? "italic" : "normal"; }

  function renderRuns(runs, x, size, lineHeight, width) {
    need(lineHeight);
    doc.setFontSize(size);
    let cx = x;
    let drew = false;
    for (const run of runs) {
      if (run.br) { y += lineHeight; cx = x; need(lineHeight); continue; }
      doc.setFont("helvetica", fontStyle(run));
      if (run.link) doc.setTextColor(17, 85, 204); else doc.setTextColor(26, 26, 26);
      for (const tok of run.text.split(/(\s+)/)) {
        if (!tok) continue;
        const w = doc.getTextWidth(tok);
        if (/^\s+$/.test(tok)) { if (cx > x) cx += w; continue; }
        if (cx + w > x + width && cx > x) { y += lineHeight; cx = x; need(lineHeight); }
        doc.text(tok, cx, y); cx += w; drew = true;
      }
    }
    if (drew) y += lineHeight;
  }

  function heading(el, lvl) {
    const size = [21, 17, 15, 13, 12, 11][lvl - 1] || 12;
    y += 8; renderRuns(collectRuns(el, { bold: true }), M, size, size * 1.3, maxW); y += 3;
  }
  function paragraph(el) {
    const imgs = Array.from(el.querySelectorAll("img"));
    if (imgs.length && !el.textContent.trim()) { imgs.forEach(image); return; }
    renderRuns(collectRuns(el, {}), M, 11, 15.5, maxW); y += 5;
  }
  function list(el, ordered) {
    let i = 1;
    Array.from(el.children).forEach((li) => {
      if (li.tagName.toLowerCase() !== "li") return;
      const bullet = ordered ? (i++) + "." : "•";
      need(15.5);
      doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(26, 26, 26);
      doc.text(bullet, M + 10, y);
      renderRuns(collectRuns(li, {}), M + 28, 11, 15.5, maxW - 28); y += 3;
    });
    y += 3;
  }
  function blockquote(el) {
    y += 4; const startY = y;
    renderRuns(collectRuns(el, { italic: true }), M + 18, 11, 15.5, maxW - 18);
    doc.setDrawColor(180); doc.setLineWidth(2); doc.line(M + 4, startY - 10, M + 4, y - 12); y += 5;
  }
  function hr() { y += 6; need(10); doc.setDrawColor(210); doc.setLineWidth(1); doc.line(M, y, pageW - M, y); y += 14; }
  function pre(el) {
    doc.setFont("courier", "normal"); doc.setFontSize(10); doc.setTextColor(40, 40, 40);
    for (const raw of el.textContent.replace(/\t/g, "  ").split("\n")) {
      for (const ln of doc.splitTextToSize(raw || " ", maxW - 12)) { need(13); doc.text(ln, M + 6, y); y += 13; }
    }
    y += 6;
  }
  function image(el) {
    const info = imgMap.get(el); if (!info || !info.w) return;
    const ratio = info.h / info.w;
    let w = Math.min(maxW, info.w * 0.75); let h = w * ratio;
    if (h > bottom - topBaseline) { h = bottom - topBaseline; w = h / ratio; }
    need(h + 6);
    const fmt = /^data:image\/png/i.test(info.src) ? "PNG" : /^data:image\/jpe?g/i.test(info.src) ? "JPEG" : "PNG";
    try { doc.addImage(info.src, fmt, M, y - 10, w, h); y += h + 8; } catch (e) { /* unsupported format */ }
  }
  function table(el) {
    const rows = Array.from(el.querySelectorAll("tr")); if (!rows.length) return;
    const cols = Math.max.apply(null, rows.map((r) => r.children.length)) || 1;
    const colW = maxW / cols; const pad = 5; const size = 10; const lh = 13;
    y += 4;
    for (const tr of rows) {
      const cells = Array.from(tr.children);
      doc.setFontSize(size);
      const wrapped = cells.map((td) => doc.splitTextToSize(td.textContent.replace(/\s+/g, " ").trim() || " ", colW - 2 * pad));
      const rowH = Math.max(lh + 2 * pad, ...wrapped.map((l) => l.length * lh + 2 * pad));
      need(rowH);
      let cx = M;
      cells.forEach((td, ci) => {
        const head = td.tagName.toLowerCase() === "th";
        doc.setDrawColor(150); doc.setLineWidth(0.5); doc.rect(cx, y - 10, colW, rowH);
        doc.setFont("helvetica", head ? "bold" : "normal"); doc.setTextColor(26, 26, 26); doc.setFontSize(size);
        wrapped[ci].forEach((ln, li) => doc.text(ln, cx + pad, y + pad + lh * li - 1));
        cx += colW;
      });
      y += rowH;
    }
    y += 8;
  }

  function walk(parent) {
    Array.from(parent.children).forEach((el) => {
      const tag = el.tagName.toLowerCase();
      if (/^h[1-6]$/.test(tag)) heading(el, +tag[1]);
      else if (tag === "p") paragraph(el);
      else if (tag === "ul") list(el, false);
      else if (tag === "ol") list(el, true);
      else if (tag === "blockquote") blockquote(el);
      else if (tag === "hr") hr();
      else if (tag === "pre") pre(el);
      else if (tag === "img") image(el);
      else if (tag === "table") table(el);
      else if (el.children.length) walk(el);
      else if (el.textContent.trim()) { renderRuns(collectRuns(el, {}), M, 11, 15.5, maxW); y += 5; }
    });
  }

  walk(root);
  doc.save(filename);
}
