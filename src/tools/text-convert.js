// Pocket — pure conversion helpers shared by the small text/dev tools. No React,
// no DOM, so they're trivially unit-testable (see text-convert.test.js).

// ---- number base ----------------------------------------------------------
const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";

// Parse an integer string written in `base` (2–36) into a BigInt, so arbitrarily
// large values never overflow. Accepts optional sign, 0x/0b/0o prefixes, and
// `_` digit separators. Throws on an invalid digit.
export function parseBigIntInBase(str, base) {
  if (base < 2 || base > 36) throw new Error("Base must be 2–36");
  let s = String(str).trim().toLowerCase();
  if (!s) throw new Error("Enter a number");
  let neg = false;
  if (s[0] === "+") s = s.slice(1);
  else if (s[0] === "-") { neg = true; s = s.slice(1); }
  if (base === 16 && s.startsWith("0x")) s = s.slice(2);
  else if (base === 2 && s.startsWith("0b")) s = s.slice(2);
  else if (base === 8 && s.startsWith("0o")) s = s.slice(2);
  s = s.replace(/_/g, "");
  if (!s) throw new Error("Enter a number");
  const b = BigInt(base);
  let acc = 0n;
  for (const ch of s) {
    const d = DIGITS.indexOf(ch);
    if (d < 0 || d >= base) throw new Error(`Invalid digit "${ch}" for base ${base}`);
    acc = acc * b + BigInt(d);
  }
  return neg ? -acc : acc;
}

export function bigIntToBase(n, base) {
  if (base < 2 || base > 36) throw new Error("Base must be 2–36");
  if (n === 0n) return "0";
  const neg = n < 0n;
  let x = neg ? -n : n;
  const b = BigInt(base);
  let out = "";
  while (x > 0n) { out = DIGITS[Number(x % b)] + out; x /= b; }
  return (neg ? "-" : "") + out;
}

export function convertBase(value, fromBase, toBase) {
  return bigIntToBase(parseBigIntInBase(value, fromBase), toBase);
}

// ---- slugify --------------------------------------------------------------
export function slugify(text, opts = {}) {
  const sep = opts.separator == null ? "-" : opts.separator;
  let s = String(text).normalize("NFKD").replace(/[̀-ͯ]/g, ""); // strip diacritics
  if (opts.lower !== false) s = s.toLowerCase();
  s = s.replace(/[^a-zA-Z0-9]+/g, sep || " ");
  if (sep) {
    const esc = sep.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    s = s.replace(new RegExp(esc + "{2,}", "g"), sep).replace(new RegExp("^" + esc + "+|" + esc + "+$", "g"), "");
  } else {
    s = s.replace(/\s+/g, "");
  }
  return s;
}

// ---- .env <-> object ------------------------------------------------------
export function parseEnv(text) {
  const obj = {};
  for (const raw of String(text).split(/\r?\n/)) {
    let line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    if (line.startsWith("export ")) line = line.slice(7).trim();
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    if (!key) continue;
    let val = line.slice(eq + 1).trim();
    if (val.length >= 2 && ((val[0] === '"' && val.endsWith('"')) || (val[0] === "'" && val.endsWith("'")))) {
      const q = val[0];
      val = val.slice(1, -1);
      if (q === '"') val = val.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\r/g, "\r").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    } else {
      const hash = val.indexOf(" #");
      if (hash !== -1) val = val.slice(0, hash).trim();
    }
    obj[key] = val;
  }
  return obj;
}

export function objectToEnv(obj) {
  const lines = [];
  for (const [k, v] of Object.entries(obj || {})) {
    let val = v == null ? "" : (typeof v === "object" ? JSON.stringify(v) : String(v));
    if (val === "" || /[\s#"'=]/.test(val)) {
      val = '"' + val.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\t/g, "\\t") + '"';
    }
    lines.push(k + "=" + val);
  }
  return lines.join("\n");
}

// ---- escaping -------------------------------------------------------------
const HTML_ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const HTML_NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", copy: "©", reg: "®", trade: "™", hellip: "…", mdash: "—", ndash: "–" };

export function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (c) => HTML_ESC[c]);
}

export function unescapeHTML(s) {
  return String(s).replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (m, ent) => {
    if (ent[0] === "#") {
      const code = ent[1] === "x" || ent[1] === "X" ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
      return Number.isFinite(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
    }
    return HTML_NAMED[ent] != null ? HTML_NAMED[ent] : m;
  });
}

export function escapeJSONString(s) {
  const j = JSON.stringify(String(s));
  return j.slice(1, -1);
}

export function unescapeJSONString(s) {
  return JSON.parse('"' + String(s).replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t") + '"');
}

export function escapeUnicode(s) {
  return String(s).replace(/[^\x00-\x7F]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
}

export function unescapeUnicode(s) {
  return String(s)
    .replace(/\\u\{([0-9a-fA-F]+)\}/g, (m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (m, h) => String.fromCharCode(parseInt(h, 16)));
}
