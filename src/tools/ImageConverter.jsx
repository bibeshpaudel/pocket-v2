// Pocket — Image Converter. Converts a raster image between PNG / JPEG / WebP
// via a canvas. 100% client-side. DS + tokens.
import React from "react";
import { Panel } from "../../Pocket Design System/components/surfaces/Panel.jsx";
import { Badge } from "../../Pocket Design System/components/core/Badge.jsx";
import { Button } from "../../Pocket Design System/components/core/Button.jsx";
import { SegmentedControl } from "../../Pocket Design System/components/forms/SegmentedControl.jsx";
import { Dropzone, Stat, CHECKER, formatBytes, readAsDataURL, loadImage, encodeImage, downloadBlob, ensureDecodable } from "./image-shared.jsx";

const MIME = { PNG: "image/png", JPEG: "image/jpeg", WebP: "image/webp" };
const EXT = { PNG: "png", JPEG: "jpg", WebP: "webp" };

export default function ImageConverterScreen() {
  const [src, setSrc] = React.useState(null); // { file, url, img }
  const [format, setFormat] = React.useState("PNG");
  const [quality, setQuality] = React.useState(0.92);
  const [out, setOut] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  const open = React.useCallback(async (file) => {
    setError(null); setOut(null); setBusy(true);
    try {
      const usable = await ensureDecodable(file);
      const url = await readAsDataURL(usable);
      const img = await loadImage(url);
      setSrc({ file, url, img });
      // default the target to something different from the source
      const from = (file.type || "").replace("image/", "");
      setFormat(from === "png" ? "WebP" : "PNG");
    } catch (e) { setError(e.message || "Could not open that image."); setSrc(null); }
    finally { setBusy(false); }
  }, []);

  const mime = MIME[format];
  const lossy = format !== "PNG";

  React.useEffect(() => {
    if (!src) return undefined;
    let cancelled = false;
    const handler = setTimeout(async () => {
      try {
        const { blob, width, height } = await encodeImage(src.img, mime, lossy ? quality : undefined, 1);
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        setOut((prev) => { if (prev && prev.url) URL.revokeObjectURL(prev.url); return { url, blob, width, height }; });
      } catch (e) { if (!cancelled) setError(e.message); }
    }, 150);
    return () => { cancelled = true; clearTimeout(handler); };
  }, [src, mime, lossy, quality]);

  const reset = () => { if (out && out.url) URL.revokeObjectURL(out.url); setSrc(null); setOut(null); setError(null); };
  const fromLabel = src ? ((src.file.type || "").replace("image/", "").toUpperCase() || "?") : "";
  const delta = src && out ? out.blob.size - src.file.size : 0;

  if (!src) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
        <Dropzone onFile={open} icon="images" title={busy ? "Decoding…" : "Drop an image to convert"} hint={busy ? "Decoding HEIC in your browser — first time loads the decoder." : "PNG ↔ JPEG ↔ WebP, plus HEIC input — converted locally, nothing uploaded"} />
        {error ? <div style={{ fontSize: 13, color: "var(--danger)" }}>{error}</div> : null}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
          <Badge kind="neutral">{fromLabel}</Badge> →
        </span>
        <SegmentedControl options={["PNG", "JPEG", "WebP"]} value={format} onChange={setFormat} />
        <label style={{ display: "flex", alignItems: "center", gap: 10, opacity: lossy ? 1 : 0.4 }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Quality</span>
          <input type="range" min="0.1" max="1" step="0.01" value={quality} disabled={!lossy}
            onChange={(e) => setQuality(Number(e.target.value))} style={{ width: 130, accentColor: "var(--amber-500)" }} />
          <code style={{ fontSize: 12, width: 34, color: "var(--text-secondary)" }}>{Math.round(quality * 100)}%</code>
        </label>
        <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Button variant="secondary" size="sm" icon="image-up" onClick={reset}>New image</Button>
          <Button variant="primary" size="sm" icon="download" disabled={!out}
            onClick={() => downloadBlob(out.blob, src.file.name.replace(/\.[^.]+$/, "") + "." + EXT[format])}>Download {EXT[format]}</Button>
        </span>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Panel title={"Source — " + fromLabel} variant="sunken" meta={formatBytes(src.file.size)}>
          <div style={{ flex: 1, minHeight: 0, display: "grid", placeItems: "center", padding: 16, ...CHECKER }}>
            <img src={src.url} alt="source" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: "var(--radius-sm)" }} />
          </div>
        </Panel>
        <Panel title={"Output — " + format} variant="sunken"
          meta={out ? formatBytes(out.blob.size) : <span style={{ color: "var(--text-tertiary)" }}>working…</span>}>
          <div style={{ flex: 1, minHeight: 0, display: "grid", placeItems: "center", padding: 16, ...CHECKER }}>
            {out ? <img src={out.url} alt="output" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: "var(--radius-sm)" }} /> : null}
          </div>
        </Panel>
      </div>

      <div style={{ flex: "none", display: "flex", gap: 28, flexWrap: "wrap", padding: "12px 16px", background: "var(--surface-raised)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)" }}>
        <Stat label="From" value={fromLabel + " · " + formatBytes(src.file.size)} />
        <Stat label="To" value={format + " · " + (out ? formatBytes(out.blob.size) : "…")} accent />
        <Stat label="Change" value={out ? (delta <= 0 ? "−" : "+") + formatBytes(Math.abs(delta)) : "…"} />
        <Stat label="Dimensions" value={`${src.img.naturalWidth} × ${src.img.naturalHeight}`} />
      </div>
    </div>
  );
}
