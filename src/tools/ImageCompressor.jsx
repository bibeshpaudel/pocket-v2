// Pocket — Image Compressor. Re-encodes a raster image through a canvas at a
// chosen quality / scale to shrink the file. 100% client-side. DS + tokens.
import React from "react";
import { Panel } from "../../Pocket Design System/components/surfaces/Panel.jsx";
import { Badge } from "../../Pocket Design System/components/core/Badge.jsx";
import { Button } from "../../Pocket Design System/components/core/Button.jsx";
import { IconButton } from "../../Pocket Design System/components/core/IconButton.jsx";
import { Select } from "../../Pocket Design System/components/forms/Select.jsx";
import { Dropzone, Stat, CHECKER, formatBytes, readAsDataURL, loadImage, encodeImage, downloadBlob, ensureDecodable } from "./image-shared.jsx";

const FORMATS = [
  { value: "keep", label: "Keep format" },
  { value: "image/jpeg", label: "JPEG" },
  { value: "image/webp", label: "WebP" },
  { value: "image/png", label: "PNG (lossless)" },
];

function targetMime(format, origType) {
  if (format !== "keep") return format;
  return ["image/jpeg", "image/webp", "image/png"].includes(origType) ? origType : "image/jpeg";
}
function extFor(mime) { return mime === "image/jpeg" ? "jpg" : mime === "image/webp" ? "webp" : "png"; }

export default function ImageCompressorScreen() {
  const [src, setSrc] = React.useState(null); // { file, url, img }
  const [format, setFormat] = React.useState("keep");
  const [quality, setQuality] = React.useState(0.7);
  const [scale, setScale] = React.useState(100);
  const [out, setOut] = React.useState(null); // { url, blob, width, height }
  const [error, setError] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  const open = React.useCallback(async (file) => {
    setError(null); setOut(null); setBusy(true);
    try {
      const usable = await ensureDecodable(file);
      const url = await readAsDataURL(usable);
      const img = await loadImage(url);
      setSrc({ file, url, img });
    } catch (e) { setError(e.message || "Could not open that image."); setSrc(null); }
    finally { setBusy(false); }
  }, []);

  const mime = src ? targetMime(format, src.file.type) : null;
  const lossy = mime === "image/jpeg" || mime === "image/webp";

  React.useEffect(() => {
    if (!src) return undefined;
    let cancelled = false;
    let createdUrl = null;
    const handler = setTimeout(async () => {
      try {
        const { blob, width, height } = await encodeImage(src.img, mime, lossy ? quality : undefined, scale / 100);
        if (cancelled) return;
        createdUrl = URL.createObjectURL(blob);
        setOut((prev) => { if (prev && prev.url) URL.revokeObjectURL(prev.url); return { url: createdUrl, blob, width, height }; });
      } catch (e) { if (!cancelled) setError(e.message); }
    }, 150);
    return () => { cancelled = true; clearTimeout(handler); };
  }, [src, mime, lossy, quality, scale]);

  const savings = src && out ? 1 - out.blob.size / src.file.size : 0;
  const savingsKind = savings > 0.4 ? "ok" : savings > 0 ? "warn" : "danger";

  const reset = () => { if (out && out.url) URL.revokeObjectURL(out.url); setSrc(null); setOut(null); setError(null); };

  if (!src) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
        <Dropzone onFile={open} icon="image-down" title={busy ? "Decoding…" : "Drop an image to compress"} hint={busy ? "Decoding HEIC in your browser — first time loads the decoder." : "PNG, JPEG, WebP or HEIC — re-encoded locally, nothing uploaded"} />
        {error ? <div style={{ fontSize: 13, color: "var(--danger)" }}>{error}</div> : null}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <Select options={FORMATS} value={format} onChange={(e) => setFormat(e.target.value)} />
        <label style={{ display: "flex", alignItems: "center", gap: 10, opacity: lossy ? 1 : 0.4 }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Quality</span>
          <input type="range" min="0.1" max="1" step="0.01" value={quality} disabled={!lossy}
            onChange={(e) => setQuality(Number(e.target.value))} style={{ width: 130, accentColor: "var(--amber-500)" }} />
          <code style={{ fontSize: 12, width: 34, color: "var(--text-secondary)" }}>{Math.round(quality * 100)}%</code>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Scale</span>
          <input type="range" min="10" max="100" step="5" value={scale}
            onChange={(e) => setScale(Number(e.target.value))} style={{ width: 110, accentColor: "var(--amber-500)" }} />
          <code style={{ fontSize: 12, width: 34, color: "var(--text-secondary)" }}>{scale}%</code>
        </label>
        <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Button variant="secondary" size="sm" icon="image-up" onClick={reset}>New image</Button>
          <Button variant="primary" size="sm" icon="download" disabled={!out}
            onClick={() => downloadBlob(out.blob, src.file.name.replace(/\.[^.]+$/, "") + "-min." + extFor(mime))}>Download</Button>
        </span>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Panel title="Original" variant="sunken" meta={formatBytes(src.file.size)}>
          <div style={{ flex: 1, minHeight: 0, display: "grid", placeItems: "center", padding: 16, ...CHECKER }}>
            <img src={src.url} alt="original" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: "var(--radius-sm)" }} />
          </div>
        </Panel>
        <Panel title="Compressed" variant="sunken"
          meta={out ? <Badge kind={savingsKind} dot>{savings >= 0 ? "−" + Math.round(savings * 100) + "%" : "+" + Math.round(-savings * 100) + "%"}</Badge> : <span style={{ color: "var(--text-tertiary)" }}>working…</span>}>
          <div style={{ flex: 1, minHeight: 0, display: "grid", placeItems: "center", padding: 16, ...CHECKER }}>
            {out ? <img src={out.url} alt="compressed" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: "var(--radius-sm)" }} /> : null}
          </div>
        </Panel>
      </div>

      <div style={{ flex: "none", display: "flex", gap: 28, flexWrap: "wrap", padding: "12px 16px", background: "var(--surface-raised)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)" }}>
        <Stat label="Original" value={formatBytes(src.file.size)} />
        <Stat label="Compressed" value={out ? formatBytes(out.blob.size) : "…"} accent />
        <Stat label="Saved" value={out ? Math.round(savings * 100) + "%" : "…"} accent />
        <Stat label="Dimensions" value={out ? `${out.width} × ${out.height}` : `${src.img.naturalWidth} × ${src.img.naturalHeight}`} />
        <Stat label="Output" value={mime.replace("image/", "").toUpperCase()} />
      </div>
    </div>
  );
}
