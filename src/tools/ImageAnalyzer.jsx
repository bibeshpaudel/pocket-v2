// Pocket — Image Analyzer. Deep, 100% client-side inspection: file + pixel
// metadata, true format detection (magic bytes), PNG internals, a dominant-colour
// palette, tonal histogram, brightness/contrast, transparency & grayscale
// detection, and EXIF (camera/exposure/GPS) for JPEGs. DS + tokens only.
import React from "react";
import { Panel } from "../../Pocket Design System/components/surfaces/Panel.jsx";
import { Badge } from "../../Pocket Design System/components/core/Badge.jsx";
import { Button } from "../../Pocket Design System/components/core/Button.jsx";
import { CopyButton } from "../../Pocket Design System/components/core/CopyButton.jsx";
import { Icon } from "../../Pocket Design System/components/core/Icon.jsx";
import { Dropzone, CHECKER, formatBytes, readAsDataURL, readAsArrayBuffer, loadImage, ensureDecodable } from "./image-shared.jsx";
import { parseExif } from "./exif.js";

// ---- format detection + container parsing ---------------------------------

function detectFormat(view) {
  if (view.byteLength < 12) return null;
  if (view.getUint16(0) === 0xffd8) return "JPEG";
  if (view.getUint32(0) === 0x89504e47) return "PNG";
  if (view.getUint32(0) === 0x47494638) return "GIF";
  if (view.getUint32(0) === 0x52494646 && view.getUint32(8) === 0x57454250) return "WebP";
  if (view.getUint16(0) === 0x424d) return "BMP";
  if (view.getUint32(4) === 0x66747970) { // ISO-BMFF 'ftyp' box → HEIC/HEIF/AVIF family
    const brand = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11)).toLowerCase();
    if (/hei|mif1|msf1|hevc|hevx/.test(brand)) return "HEIC";
    if (/avif|avis/.test(brand)) return "AVIF";
  }
  return null;
}

const PNG_COLOR = { 0: "Grayscale", 2: "Truecolor (RGB)", 3: "Indexed (palette)", 4: "Grayscale + alpha", 6: "Truecolor + alpha (RGBA)" };

function parsePng(view) {
  // IHDR data begins at byte 16: width(4) height(4) bitDepth(1) colorType(1) ... interlace(1)@28
  const bitDepth = view.getUint8(24);
  const colorType = view.getUint8(25);
  const interlace = view.getUint8(28);
  return { bitDepth, colorType, colorTypeName: PNG_COLOR[colorType] || String(colorType), interlace: interlace ? "Adam7" : "None", hasAlpha: colorType === 4 || colorType === 6 };
}

function gifFrames(view) {
  // count image descriptors (0x2C) — >1 means animated
  let frames = 0;
  for (let i = 13; i < view.byteLength - 1; i++) if (view.getUint8(i) === 0x2c) frames++;
  return frames;
}

// ---- pixel analysis (downscaled sample) -----------------------------------

function analyzePixels(img) {
  const MAX = 320;
  const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, w, h);
  let img2;
  try { img2 = ctx.getImageData(0, 0, w, h); } catch (e) { return null; } // tainted canvas
  const d = img2.data;
  const total = w * h;

  const histL = new Array(256).fill(0);
  const buckets = new Map();
  const unique = new Set();
  let sumR = 0, sumG = 0, sumB = 0, lumSum = 0, lumSqSum = 0, transparent = 0, gray = 0, opaque = 0;

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
    if (a < 16) { transparent++; continue; }
    opaque++;
    sumR += r; sumG += g; sumB += b;
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    lumSum += lum; lumSqSum += lum * lum;
    histL[Math.min(255, Math.round(lum))]++;
    if (Math.abs(r - g) < 12 && Math.abs(g - b) < 12 && Math.abs(r - b) < 12) gray++;
    unique.add((r << 16) | (g << 8) | b);
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3); // 5 bits/channel
    let bk = buckets.get(key);
    if (!bk) { bk = { c: 0, r: 0, g: 0, b: 0 }; buckets.set(key, bk); }
    bk.c++; bk.r += r; bk.g += g; bk.b += b;
  }
  if (!opaque) return { allTransparent: true, transparentPct: 100 };

  const hex = (r, g, b) => "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
  const palette = [...buckets.values()].sort((a, b) => b.c - a.c).slice(0, 6)
    .map((bk) => ({ hex: hex(bk.r / bk.c, bk.g / bk.c, bk.b / bk.c).toUpperCase(), pct: Math.round((bk.c / opaque) * 100) }));
  const meanL = lumSum / opaque;
  const std = Math.sqrt(Math.max(0, lumSqSum / opaque - meanL * meanL));

  return {
    hist: histL,
    avg: hex(sumR / opaque, sumG / opaque, sumB / opaque).toUpperCase(),
    palette,
    brightness: Math.round((meanL / 255) * 100),
    contrast: std,
    contrastLabel: std < 40 ? "Low" : std < 75 ? "Medium" : "High",
    transparentPct: Math.round((transparent / total) * 100),
    hasAlpha: transparent > 0,
    grayscale: gray / opaque > 0.98,
    uniqueColors: unique.size,
    scaled: scale < 1,
  };
}

// ---- tonal histogram ------------------------------------------------------

function Histogram({ hist }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const c = ref.current; if (!c || !hist) return;
    const ctx = c.getContext("2d");
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);
    const max = Math.max.apply(null, hist) || 1;
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--amber-500").trim() || "#f59e0b";
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x < 256; x++) { const v = Math.sqrt(hist[x] / max); ctx.lineTo((x / 255) * W, H - v * H); }
    ctx.lineTo(W, H); ctx.closePath();
    ctx.globalAlpha = 0.85; ctx.fillStyle = accent; ctx.fill();
  }, [hist]);
  return <canvas ref={ref} width={560} height={84} style={{ width: "100%", height: 84, display: "block", borderRadius: "var(--radius-sm)" }} />;
}

// ---- small layout helpers -------------------------------------------------

function gcd(a, b) { return b ? gcd(b, a % b) : a; }
function aspect(w, h) { const g = gcd(w, h) || 1; return `${w / g}:${h / g}`; }

function Row({ label, value, mono = true, children }) {
  if ((value === undefined || value === null || value === "") && !children) return null;
  return (
    <div style={{ display: "flex", gap: 12, padding: "7px 0", borderTop: "1px solid var(--border-subtle)" }}>
      <span style={{ fontSize: 12, color: "var(--text-tertiary)", width: 116, flex: "none" }}>{label}</span>
      <span style={{ fontSize: 13, color: "var(--text-primary)", fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)", wordBreak: "break-all", display: "flex", alignItems: "center", gap: 8 }}>{value}{children}</span>
    </div>
  );
}
function Section({ title, children, actions, meta }) {
  return (
    <Panel title={title} variant="raised" actions={actions} meta={meta} style={{ flex: "none" }}>
      <div style={{ padding: "2px 16px 12px" }}>{children}</div>
    </Panel>
  );
}

export default function ImageAnalyzerScreen() {
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  const open = React.useCallback(async (file) => {
    setError(null); setData(null); setBusy(true);
    try {
      const buf = await readAsArrayBuffer(file);
      const view = new DataView(buf);
      const format = detectFormat(view);                // detect from the ORIGINAL bytes
      const usable = await ensureDecodable(file);        // decode HEIC → PNG for canvas
      const url = await readAsDataURL(usable);
      const img = await loadImage(url);
      const png = format === "PNG" ? parsePng(view) : null;
      const frames = format === "GIF" ? gifFrames(view) : null;
      const exif = format === "JPEG" ? (() => { try { return parseExif(buf); } catch (e) { return null; } })() : null;
      const pixels = analyzePixels(img);
      setData({ file, url, img, format, png, frames, exif, pixels });
    } catch (e) { setError(e.message || "Could not analyze that image."); }
    finally { setBusy(false); }
  }, []);

  if (!data) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
        <Dropzone onFile={open} icon="scan-search" title={busy ? "Decoding…" : "Drop an image to inspect"} hint={busy ? "Decoding HEIC in your browser — first time loads the decoder." : "Format internals, colour palette, histogram, brightness/contrast — plus EXIF for JPEGs, HEIC supported. Read locally."} />
        {error ? <div style={{ fontSize: 13, color: "var(--danger)" }}>{error}</div> : null}
      </div>
    );
  }

  const { file, url, img, format, png, frames, exif, pixels } = data;
  const w = img.naturalWidth, h = img.naturalHeight;
  const mp = (w * h / 1e6).toFixed(1);
  const bpp = file.size && w && h ? (file.size * 8 / (w * h)).toFixed(2) : null;
  const ratio = file.size ? (w * h * 4 / file.size).toFixed(1) : null;
  const cam = exif && exif.camera;
  const settings = exif && exif.settings;
  const gps = exif && exif.gps;
  const settingsEntries = settings ? Object.entries(settings).filter(([, v]) => v != null) : [];
  const px = pixels && !pixels.allTransparent ? pixels : null;
  const claimed = (file.type || "").toLowerCase().replace("image/", "");
  const extMismatch = format && claimed && !(format === "JPEG" ? "jpeg" : format.toLowerCase()).includes(claimed) && !claimed.includes(format === "JPEG" ? "jpeg" : format.toLowerCase());

  const copyClr = (hex) => { try { navigator.clipboard.writeText(hex); } catch (e) { /* ignore */ } };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Badge kind="accent">{format || (file.type || "?").replace("image/", "").toUpperCase()}</Badge>
        {extMismatch ? <Badge kind="warn">type mismatch</Badge> : null}
        {px && px.grayscale ? <Badge kind="neutral">Grayscale</Badge> : null}
        {px && px.hasAlpha ? <Badge kind="neutral">Has alpha</Badge> : null}
        {frames && frames > 1 ? <Badge kind="neutral">{frames} frames</Badge> : null}
        <span style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
        <span style={{ marginLeft: "auto" }}>
          <Button variant="secondary" size="sm" icon="image-up" onClick={() => setData(null)}>New image</Button>
        </span>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "minmax(0, 1fr)", gap: 14 }}>
        {/* Left: preview + palette + histogram */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0, overflowY: "auto" }}>
          <Panel title="Preview" variant="sunken" meta={`${w} × ${h}`} style={{ flex: 1, minHeight: 220 }}>
            <div style={{ flex: 1, minHeight: 0, display: "grid", placeItems: "center", padding: 16, ...CHECKER }}>
              <img src={url} alt={file.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: "var(--radius-sm)" }} />
            </div>
          </Panel>

          {px ? (
            <Section title="Dominant colours" meta={px.scaled ? <span style={{ fontSize: 11 }}>sampled</span> : null}
              actions={<CopyButton getText={() => px.palette.map((p) => p.hex).join(", ")} label="Copy" />}>
              <div style={{ display: "flex", gap: 8, paddingTop: 6, flexWrap: "wrap" }}>
                {px.palette.map((p, i) => (
                  <button key={i} type="button" onClick={() => copyClr(p.hex)} title={`${p.hex} — click to copy`}
                    style={{ flex: "1 1 0", minWidth: 64, border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", overflow: "hidden", cursor: "pointer", background: "transparent", padding: 0 }}>
                    <span style={{ display: "block", height: 38, background: p.hex }} />
                    <span style={{ display: "block", padding: "4px 2px 5px", fontSize: 10.5, fontFamily: "var(--font-mono)", color: "var(--text-secondary)", textAlign: "center", background: "var(--surface-raised)" }}>{p.hex}<br />{p.pct}%</span>
                  </button>
                ))}
              </div>
            </Section>
          ) : null}

          {px ? (
            <Section title="Tonal histogram (luminance)">
              <div style={{ paddingTop: 8 }}><Histogram hist={px.hist} /></div>
            </Section>
          ) : null}
        </div>

        {/* Right: metadata sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0, overflowY: "auto" }}>
          <Section title="Properties">
            <Row label="Format" value={format ? format + (file.type ? `  ·  ${file.type}` : "") : (file.type || "unknown")} />
            <Row label="Size" value={formatBytes(file.size)} />
            <Row label="Dimensions" value={`${w} × ${h} px`} />
            <Row label="Aspect ratio" value={aspect(w, h)} />
            <Row label="Megapixels" value={mp + " MP"} />
            <Row label="Bits / pixel" value={bpp ? bpp + " bpp" : null} />
            <Row label="Compression" value={ratio ? `${ratio}:1 vs raw RGBA` : null} />
            <Row label="Modified" value={file.lastModified ? new Date(file.lastModified).toLocaleString() : null} mono={false} />
          </Section>

          {px ? (
            <Section title="Colour & tone">
              <Row label="Average">
                <span style={{ width: 16, height: 16, borderRadius: 4, background: px.avg, border: "1px solid var(--border-strong)", display: "inline-block" }} />
                {px.avg}
              </Row>
              <Row label="Brightness" value={px.brightness + "%"} />
              <Row label="Contrast" value={`${px.contrastLabel} (σ ${Math.round(px.contrast)})`} mono={false} />
              <Row label="Transparency" value={px.transparentPct + "% of pixels"} />
              <Row label="Grayscale" value={px.grayscale ? "Yes" : "No"} mono={false} />
              <Row label="Distinct colours" value={(px.scaled ? "≈ " : "") + px.uniqueColors.toLocaleString() + (px.scaled ? " (sampled)" : "")} />
            </Section>
          ) : null}

          {png ? (
            <Section title="PNG structure">
              <Row label="Colour type" value={png.colorTypeName} mono={false} />
              <Row label="Bit depth" value={png.bitDepth + " bits/channel"} />
              <Row label="Alpha channel" value={png.hasAlpha ? "Yes" : "No"} mono={false} />
              <Row label="Interlace" value={png.interlace} mono={false} />
            </Section>
          ) : null}

          {cam && (cam.Make || cam.Model || cam.DateTimeOriginal || cam.LensModel) ? (
            <Section title="Camera" actions={<CopyButton getText={() => JSON.stringify(exif.raw, null, 2)} label="Copy EXIF" />}>
              <Row label="Make" value={cam.Make} mono={false} />
              <Row label="Model" value={cam.Model} mono={false} />
              <Row label="Lens" value={cam.LensModel} mono={false} />
              <Row label="Taken" value={cam.DateTimeOriginal} mono={false} />
              <Row label="Orientation" value={cam.Orientation} mono={false} />
              <Row label="Software" value={cam.Software} mono={false} />
            </Section>
          ) : null}

          {settingsEntries.length ? (
            <Section title="Exposure">
              {settingsEntries.map(([k, v]) => <Row key={k} label={k} value={v} />)}
            </Section>
          ) : null}

          {gps ? (
            <Section title="Location">
              <Row label="Coordinates" value={`${gps.lat}, ${gps.lon}`} />
              <Row label="Altitude" value={gps.altitude != null ? Math.round(gps.altitude) + " m" : null} />
              <div style={{ paddingTop: 10, display: "flex", gap: 18, flexWrap: "wrap" }}>
                <a href={`https://www.openstreetmap.org/?mlat=${gps.lat}&mlon=${gps.lon}#map=14/${gps.lat}/${gps.lon}`} target="_blank" rel="noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-accent)", textDecoration: "none" }}>
                  <Icon name="external-link" size={13} /> OpenStreetMap
                </a>
                <a href={`https://www.google.com/maps/search/?api=1&query=${gps.lat},${gps.lon}`} target="_blank" rel="noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-accent)", textDecoration: "none" }}>
                  <Icon name="external-link" size={13} /> Google Maps
                </a>
              </div>
            </Section>
          ) : null}

          {!exif && format === "JPEG" ? (
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", padding: "0 2px" }}>No EXIF metadata found in this JPEG (it may have been stripped).</div>
          ) : null}
          {format === "HEIC" ? (
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", padding: "0 2px" }}>HEIC decoded to RGB for analysis. Pixel/colour stats are accurate; embedded EXIF isn't parsed for HEIC yet.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
