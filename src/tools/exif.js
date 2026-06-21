// Pocket — minimal EXIF reader for JPEG (APP1 / TIFF). Pure client-side, no deps.
// Returns a friendly { camera, settings, gps, raw } object, or null if absent.

const TYPE_SIZE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };

const IFD0 = { 0x010f: "Make", 0x0110: "Model", 0x0112: "Orientation", 0x0131: "Software", 0x0132: "DateTime", 0x011a: "XResolution", 0x011b: "YResolution" };
const EXIF = { 0x829a: "ExposureTime", 0x829d: "FNumber", 0x8827: "ISO", 0x8822: "ExposureProgram", 0x9003: "DateTimeOriginal", 0x920a: "FocalLength", 0xa402: "ExposureMode", 0xa403: "WhiteBalance", 0xa434: "LensModel", 0x9209: "Flash", 0xa002: "PixelXDimension", 0xa003: "PixelYDimension" };
const GPS = { 0x0001: "GPSLatitudeRef", 0x0002: "GPSLatitude", 0x0003: "GPSLongitudeRef", 0x0004: "GPSLongitude", 0x0006: "GPSAltitude" };

const ORIENTATION = { 1: "Normal", 2: "Mirrored", 3: "Rotated 180°", 4: "Mirrored + 180°", 5: "Mirrored + 90° CW", 6: "Rotated 90° CW", 7: "Mirrored + 90° CCW", 8: "Rotated 90° CCW" };

function readValue(view, tiff, type, count, valueOffset, little) {
  const size = TYPE_SIZE[type];
  if (!size) return null;
  const total = size * count;
  const base = total > 4 ? tiff + view.getUint32(valueOffset, little) : valueOffset;
  if (type === 2) { // ASCII
    let s = "";
    for (let i = 0; i < count; i++) { const c = view.getUint8(base + i); if (c === 0) break; s += String.fromCharCode(c); }
    return s.trim();
  }
  const read = (off) => {
    switch (type) {
      case 1: case 7: return view.getUint8(off);
      case 3: return view.getUint16(off, little);
      case 4: return view.getUint32(off, little);
      case 9: return view.getInt32(off, little);
      case 5: return view.getUint32(off, little) / (view.getUint32(off + 4, little) || 1);
      case 10: return view.getInt32(off, little) / (view.getInt32(off + 4, little) || 1);
      default: return null;
    }
  };
  if (count === 1) return read(base);
  const arr = [];
  for (let i = 0; i < count; i++) arr.push(read(base + i * size));
  return arr;
}

function readIFD(view, tiff, ifdOffset, little, names, out) {
  const count = view.getUint16(tiff + ifdOffset, little);
  let p = tiff + ifdOffset + 2;
  const pointers = {};
  for (let i = 0; i < count; i++) {
    const tag = view.getUint16(p, little);
    const type = view.getUint16(p + 2, little);
    const num = view.getUint32(p + 4, little);
    const valueOffset = p + 8;
    if (tag === 0x8769) pointers.exif = view.getUint32(valueOffset, little);
    else if (tag === 0x8825) pointers.gps = view.getUint32(valueOffset, little);
    else if (names[tag]) out[names[tag]] = readValue(view, tiff, type, num, valueOffset, little);
    p += 12;
  }
  return pointers;
}

function toDecimal(dms, ref) {
  if (!Array.isArray(dms) || dms.length < 3) return null;
  let dec = dms[0] + dms[1] / 60 + dms[2] / 3600;
  if (ref === "S" || ref === "W") dec = -dec;
  return Math.round(dec * 1e6) / 1e6;
}

export function parseExif(buffer) {
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null; // not JPEG
  let offset = 2;
  let app1 = -1;
  while (offset + 4 <= view.byteLength) {
    const marker = view.getUint16(offset);
    if ((marker & 0xff00) !== 0xff00) break;
    if (marker === 0xffe1) { app1 = offset; break; }
    if (marker === 0xffda) break; // start of scan — no more metadata
    offset += 2 + view.getUint16(offset + 2);
  }
  if (app1 < 0) return null;

  const seg = app1 + 4;
  // "Exif\0\0"
  if (view.getUint32(seg) !== 0x45786966) return null;
  const tiff = seg + 6;
  const le = view.getUint16(tiff) === 0x4949;
  const ifd0 = view.getUint32(tiff + 4, le);

  const raw = {};
  const ptr = readIFD(view, tiff, ifd0, le, IFD0, raw);
  if (ptr.exif != null) readIFD(view, tiff, ptr.exif, le, EXIF, raw);
  const gpsRaw = {};
  if (ptr.gps != null) readIFD(view, tiff, ptr.gps, le, GPS, gpsRaw);

  if (Object.keys(raw).length === 0 && Object.keys(gpsRaw).length === 0) return null;

  const fmt = {
    Make: raw.Make, Model: raw.Model, LensModel: raw.LensModel, Software: raw.Software,
    Orientation: raw.Orientation != null ? (ORIENTATION[raw.Orientation] || raw.Orientation) : undefined,
    DateTimeOriginal: raw.DateTimeOriginal || raw.DateTime,
  };
  const settings = {};
  if (raw.ExposureTime) settings.Exposure = raw.ExposureTime >= 1 ? raw.ExposureTime + "s" : "1/" + Math.round(1 / raw.ExposureTime) + "s";
  if (raw.FNumber) settings.Aperture = "ƒ/" + (Math.round(raw.FNumber * 10) / 10);
  if (raw.ISO) settings.ISO = "ISO " + raw.ISO;
  if (raw.FocalLength) settings.FocalLength = (Math.round(raw.FocalLength * 10) / 10) + " mm";

  let gps = null;
  const lat = toDecimal(gpsRaw.GPSLatitude, gpsRaw.GPSLatitudeRef);
  const lon = toDecimal(gpsRaw.GPSLongitude, gpsRaw.GPSLongitudeRef);
  if (lat != null && lon != null) gps = { lat, lon, altitude: gpsRaw.GPSAltitude };

  return { camera: fmt, settings, gps, raw: { ...raw, ...gpsRaw } };
}
