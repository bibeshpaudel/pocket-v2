// Pocket — Environment Inspector engine. Collects best-effort diagnostics about
// the current browser/device/network entirely client-side. Every collector
// returns rows of { label, value, status, note, mono } where status is one of:
//   "ok"          — reported directly by the browser
//   "estimated"   — heuristic / best-effort, may be spoofed or bucketed
//   "unavailable" — the API doesn't exist in this browser
//   "restricted"  — hidden until the user grants a permission
// parseUserAgent / detectDeviceType / fmtBytes are pure (unit-tested in
// env-inspect.test.js); everything else reads browser APIs and only runs in
// the browser. Only fetchNetworkIntel() ever touches the network, and only
// when explicitly invoked from the UI.

export function row(label, value, opts = {}) {
  return {
    label,
    value,
    status: opts.status || "ok",
    note: opts.note || null,
    mono: opts.mono !== false,
  };
}

// ---------------------------------------------------------------- pure utils

export function fmtBytes(n) {
  if (n == null || isNaN(n)) return null;
  if (n < 1024) return n + " B";
  const units = ["KB", "MB", "GB", "TB"];
  let v = n;
  let i = -1;
  do { v /= 1024; i++; } while (v >= 1024 && i < units.length - 1);
  return (v >= 100 ? Math.round(v) : Math.round(v * 10) / 10) + " " + units[i];
}

// Best-effort user-agent parse. UA strings are frozen/spoofable by design, so
// callers should surface results as "estimated".
export function parseUserAgent(ua) {
  ua = ua || "";
  const grab = (re) => { const m = ua.match(re); return m ? m[1] : ""; };

  // --- OS ---
  let os = "Unknown";
  if (/Windows NT 10\.0/.test(ua)) os = "Windows 10 / 11"; // NT 10.0 covers both — Windows 11 is not distinguishable from the UA
  else if (/Windows NT 6\.3/.test(ua)) os = "Windows 8.1";
  else if (/Windows NT 6\.2/.test(ua)) os = "Windows 8";
  else if (/Windows NT 6\.1/.test(ua)) os = "Windows 7";
  else if (/Windows/.test(ua)) os = "Windows";
  else if (/iPhone|iPod/.test(ua)) os = "iOS" + (grab(/OS (\d+[_\d]*) like Mac/) ? " " + grab(/OS (\d+[_\d]*) like Mac/).replace(/_/g, ".") : "");
  else if (/iPad/.test(ua)) os = "iPadOS";
  else if (/Mac OS X/.test(ua)) {
    const v = grab(/Mac OS X (\d+[_.\d]*)/).replace(/_/g, ".");
    os = "macOS" + (v ? " " + v : ""); // Safari freezes this at 10.15.7 on newer macOS
  }
  else if (/CrOS/.test(ua)) os = "ChromeOS";
  else if (/Android/.test(ua)) os = "Android" + (grab(/Android ([\d.]+)/) ? " " + grab(/Android ([\d.]+)/) : "");
  else if (/Linux/.test(ua)) os = "Linux";

  // --- Browser + engine (order matters: forks embed "Chrome" / "Safari") ---
  let browser = "Unknown", version = "", engine = "Unknown";
  if (/Edg\//.test(ua)) { browser = "Microsoft Edge"; version = grab(/Edg\/([\d.]+)/); engine = "Blink"; }
  else if (/EdgiOS\//.test(ua)) { browser = "Microsoft Edge (iOS)"; version = grab(/EdgiOS\/([\d.]+)/); engine = "WebKit"; }
  else if (/OPR\//.test(ua)) { browser = "Opera"; version = grab(/OPR\/([\d.]+)/); engine = "Blink"; }
  else if (/SamsungBrowser\//.test(ua)) { browser = "Samsung Internet"; version = grab(/SamsungBrowser\/([\d.]+)/); engine = "Blink"; }
  else if (/CriOS\//.test(ua)) { browser = "Chrome (iOS)"; version = grab(/CriOS\/([\d.]+)/); engine = "WebKit"; }
  else if (/FxiOS\//.test(ua)) { browser = "Firefox (iOS)"; version = grab(/FxiOS\/([\d.]+)/); engine = "WebKit"; }
  else if (/Firefox\//.test(ua)) { browser = "Firefox"; version = grab(/Firefox\/([\d.]+)/); engine = "Gecko"; }
  else if (/Chrome\//.test(ua)) { browser = "Chrome"; version = grab(/Chrome\/([\d.]+)/); engine = "Blink"; }
  else if (/Version\/[\d.]+.*Safari/.test(ua)) { browser = "Safari"; version = grab(/Version\/([\d.]+)/); engine = "WebKit"; }
  else if (/AppleWebKit/.test(ua)) { engine = "WebKit"; }

  return { browser, version, engine, os };
}

// Rough device classification from UA + touch + viewport. iPads in
// desktop-mode report a Mac UA, so touch points are the tie-breaker.
export function detectDeviceType({ ua = "", maxTouchPoints = 0, width = 0 } = {}) {
  if (/iPad/.test(ua)) return "Tablet";
  if (/Macintosh/.test(ua) && maxTouchPoints > 1) return "Tablet (iPad in desktop mode)";
  if (/iPhone|iPod/.test(ua)) return "Mobile";
  if (/Android/.test(ua)) return /Mobile/.test(ua) ? "Mobile" : "Tablet";
  if (/Mobi/.test(ua)) return "Mobile";
  if (maxTouchPoints > 0 && width > 0 && width < 1100) return "Tablet / touch device";
  return "Desktop";
}

// ------------------------------------------------------------ sync collectors

const UA_NOTE = "Derived from the user-agent, which browsers freeze and users can spoof.";

export function collectSystem() {
  const nav = navigator;
  const ua = nav.userAgent || "";
  const parsed = parseUserAgent(ua);
  const uaPlatform = nav.userAgentData && nav.userAgentData.platform;
  const touch = nav.maxTouchPoints || 0;

  let os = uaPlatform || parsed.os;
  if (/^mac/i.test(os) && touch > 1) os = "iPadOS (desktop-mode UA)";

  return [
    row("Operating system", os, { status: "estimated", note: UA_NOTE, mono: false }),
    row("Platform", nav.platform || null, {
      status: nav.platform ? "estimated" : "unavailable",
      note: "navigator.platform is deprecated and frozen in modern browsers.",
    }),
    row("CPU cores", nav.hardwareConcurrency ? String(nav.hardwareConcurrency) : null, {
      status: nav.hardwareConcurrency ? "estimated" : "unavailable",
      note: "Logical cores — some browsers clamp this value to limit fingerprinting.",
    }),
    row("Device memory", nav.deviceMemory ? "≈ " + nav.deviceMemory + " GB" : null, {
      status: nav.deviceMemory ? "estimated" : "unavailable",
      note: nav.deviceMemory
        ? "navigator.deviceMemory is bucketed (0.25–8 GB); real RAM may be higher."
        : "navigator.deviceMemory is Chromium-only.",
    }),
    row("Screen", screen.width + " × " + screen.height + " (usable " + screen.availWidth + " × " + screen.availHeight + ")"),
    row("Viewport", window.innerWidth + " × " + window.innerHeight),
    row("Pixel ratio", String(window.devicePixelRatio || 1), { note: "Changes with page zoom and OS display scaling." }),
    row("Color depth", screen.colorDepth + "-bit"),
    row("Touch support", touch > 0 ? "Yes — " + touch + " touch point" + (touch > 1 ? "s" : "") : "No", { mono: false }),
    row("Device type", detectDeviceType({ ua, maxTouchPoints: touch, width: window.innerWidth }), {
      status: "estimated", note: "Classified from UA + touch + viewport heuristics.", mono: false,
    }),
    row("Timezone", (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return null; } })(), {
      note: "UTC offset right now: " + (-new Date().getTimezoneOffset() / 60) + "h.",
    }),
  ];
}

export function collectBrowser() {
  const nav = navigator;
  const parsed = parseUserAgent(nav.userAgent || "");

  // Prefer the branded entry from Client Hints when available (Chromium).
  let name = parsed.browser + (parsed.version ? " " + parsed.version.split(".")[0] : "");
  if (nav.userAgentData && Array.isArray(nav.userAgentData.brands)) {
    const branded = nav.userAgentData.brands.find(
      (b) => b.brand && !/Not.?A.?Brand/i.test(b.brand) && b.brand !== "Chromium"
    );
    if (branded) name = branded.brand + " " + branded.version;
  }

  const dnt = nav.doNotTrack;
  const gpc = nav.globalPrivacyControl;

  return [
    row("Browser", name, { status: "estimated", note: UA_NOTE, mono: false }),
    row("Engine", parsed.engine, { status: "estimated", mono: false }),
    row("Full version", parsed.version || null, { status: parsed.version ? "estimated" : "unavailable" }),
    row("Language", nav.language, { note: nav.languages && nav.languages.length > 1 ? "All: " + nav.languages.join(", ") : null }),
    row("Cookies enabled", nav.cookieEnabled ? "Yes" : "No", { mono: false }),
    row("Online", nav.onLine ? "Yes" : "No — offline", {
      mono: false, note: "navigator.onLine only proves a network interface is up, not real internet reachability.",
    }),
    row("Do Not Track", dnt === "1" ? "Enabled" : dnt === "0" ? "Disabled" : null, {
      status: dnt === "1" || dnt === "0" ? "ok" : "unavailable",
      note: "DNT is deprecated; many browsers no longer send it.", mono: false,
    }),
    row("Global Privacy Control", gpc === undefined ? null : gpc ? "Enabled" : "Disabled", {
      status: gpc === undefined ? "unavailable" : "ok",
      note: gpc === undefined ? "navigator.globalPrivacyControl not supported here." : null, mono: false,
    }),
    row("PDF viewer", "pdfViewerEnabled" in nav ? (nav.pdfViewerEnabled ? "Built-in" : "None") : null, {
      status: "pdfViewerEnabled" in nav ? "ok" : "unavailable", mono: false,
    }),
    row("User agent", nav.userAgent || null, { note: "The raw string every site sees." }),
  ];
}

export function collectNetwork() {
  const nav = navigator;
  const c = nav.connection || nav.mozConnection || nav.webkitConnection;
  const rows = [
    row("Status", nav.onLine ? "Online" : "Offline", { mono: false, note: "Updates live when the connection drops or returns." }),
  ];
  if (!c) {
    rows.push(row("Connection details", null, {
      status: "unavailable",
      note: "The Network Information API (navigator.connection) is Chromium-only — Firefox and Safari don't expose it.",
    }));
    return rows;
  }
  const FP_NOTE = "Rounded and capped by the browser to limit fingerprinting — treat as a rough estimate.";
  rows.push(
    row("Effective type", c.effectiveType || null, {
      status: c.effectiveType ? "estimated" : "unavailable",
      note: "A speed classification (slow-2g…4g), not the physical connection.",
    }),
    row("Downlink", c.downlink != null ? c.downlink + " Mb/s" : null, { status: c.downlink != null ? "estimated" : "unavailable", note: FP_NOTE }),
    row("Round-trip time", c.rtt != null ? c.rtt + " ms" : null, { status: c.rtt != null ? "estimated" : "unavailable", note: FP_NOTE }),
    row("Data saver", c.saveData != null ? (c.saveData ? "On" : "Off") : null, { status: c.saveData != null ? "ok" : "unavailable", mono: false })
  );
  if (c.type) rows.push(row("Connection type", c.type, { status: "estimated" }));
  return rows;
}

export function collectSecurity() {
  let framed = false;
  try { framed = window.self !== window.top; } catch (e) { framed = true; } // cross-origin parent throws
  return [
    row("Secure context", window.isSecureContext ? "Yes" : "No", {
      mono: false, note: "Powerful APIs (crypto.subtle, service workers, media devices) require a secure context.",
    }),
    row("Protocol", location.protocol.replace(":", "").toUpperCase(), {
      note: location.protocol === "https:" ? null : "Not HTTPS — many modern APIs are disabled on insecure origins.",
    }),
    row("Origin", location.origin),
    row("Embedded in iframe", framed ? "Yes" : "No", {
      mono: false, note: framed ? "This page is running inside another page's frame." : null,
    }),
    row("Cross-origin isolated", window.crossOriginIsolated ? "Yes" : "No", {
      mono: false, note: "Needs COOP + COEP headers; unlocks SharedArrayBuffer and precise timers.",
    }),
    row("Referrer", document.referrer || "(none)", { note: "What this page saw in document.referrer on load." }),
  ];
}

export function collectGraphics() {
  const rows = [];
  let canvas, gl;
  try {
    canvas = document.createElement("canvas");
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  } catch (e) { /* fall through */ }

  if (!gl) {
    rows.push(row("WebGL", "Not available", { status: "unavailable", note: "No WebGL context could be created — GPU details can't be read.", mono: false }));
  } else {
    let vendor = null, renderer = null, masked = true;
    try {
      const dbg = gl.getExtension("WEBGL_debug_renderer_info");
      if (dbg) {
        vendor = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL);
        renderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
        masked = false;
      } else {
        vendor = gl.getParameter(gl.VENDOR);
        renderer = gl.getParameter(gl.RENDERER);
      }
    } catch (e) { /* keep nulls */ }
    const GPU_NOTE = "Browsers may report a generic or ANGLE-translated string here to limit fingerprinting — this is not always the exact GPU model.";
    rows.push(
      row("GPU renderer", renderer, { status: "estimated", note: GPU_NOTE }),
      row("GPU vendor", vendor, { status: "estimated", note: masked ? "Unmasked strings were blocked; showing the generic WebGL vendor." : GPU_NOTE }),
      row("WebGL version", (() => { try { return gl.getParameter(gl.VERSION); } catch (e) { return null; } })()),
      row("GLSL version", (() => { try { return gl.getParameter(gl.SHADING_LANGUAGE_VERSION); } catch (e) { return null; } })()),
      row("Max texture size", (() => { try { return gl.getParameter(gl.MAX_TEXTURE_SIZE) + " px"; } catch (e) { return null; } })())
    );
    try { const lose = gl.getExtension("WEBGL_lose_context"); if (lose) lose.loseContext(); } catch (e) { /* best effort */ }
  }

  let gl2 = false;
  try { gl2 = !!document.createElement("canvas").getContext("webgl2"); } catch (e) { /* no */ }
  rows.push(row("WebGL 2", gl2 ? "Supported" : "Not supported", { mono: false }));
  rows.push(row("WebGPU", typeof navigator !== "undefined" && "gpu" in navigator ? "Supported" : "Not supported", { mono: false }));
  return rows;
}

export function collectCapabilities() {
  const t = (fn) => { try { return !!fn(); } catch (e) { return false; } };
  const caps = [
    ["Canvas 2D", t(() => document.createElement("canvas").getContext("2d"))],
    ["WebGL", t(() => document.createElement("canvas").getContext("webgl"))],
    ["WebAssembly", typeof WebAssembly !== "undefined"],
    ["Web Workers", typeof Worker !== "undefined"],
    ["Shared Workers", typeof SharedWorker !== "undefined"],
    ["Service Workers", t(() => "serviceWorker" in navigator)],
    ["SharedArrayBuffer", typeof SharedArrayBuffer !== "undefined"],
    ["OffscreenCanvas", typeof OffscreenCanvas !== "undefined"],
    ["IndexedDB", t(() => "indexedDB" in window)],
    ["Cache Storage", t(() => "caches" in window)],
    ["Web Crypto", t(() => crypto && crypto.subtle)],
    ["WebRTC", typeof RTCPeerConnection !== "undefined"],
    ["WebSockets", typeof WebSocket !== "undefined"],
    ["Clipboard API", t(() => navigator.clipboard)],
    ["Notifications", typeof Notification !== "undefined"],
    ["Geolocation", t(() => "geolocation" in navigator)],
    ["Web Share", t(() => navigator.share)],
    ["File System Access", t(() => "showOpenFilePicker" in window)],
    ["Speech Synthesis", t(() => "speechSynthesis" in window)],
    ["Vibration", t(() => "vibrate" in navigator)],
    ["Battery Status", t(() => "getBattery" in navigator)],
    ["Web Bluetooth", t(() => "bluetooth" in navigator)],
    ["WebUSB", t(() => "usb" in navigator)],
    ["Pointer Events", typeof PointerEvent !== "undefined"],
  ];
  return caps.map(([label, supported]) => ({
    label,
    value: supported ? "Supported" : "Not supported",
    status: "ok",
    note: null,
    mono: false,
    supported,
  }));
}

// ----------------------------------------------------------- async collectors

function storageWorks(kind) {
  try {
    const s = window[kind];
    const k = "__pocket_probe__";
    s.setItem(k, "1");
    s.removeItem(k);
    return "Available";
  } catch (e) {
    return "Blocked";
  }
}

export async function collectStorage() {
  const rows = [
    row("localStorage", storageWorks("localStorage"), { mono: false, note: "Probed with a write + delete — can be blocked by settings or private mode." }),
    row("sessionStorage", storageWorks("sessionStorage"), { mono: false }),
    row("IndexedDB", "indexedDB" in window ? "Available" : "Not available", { mono: false }),
    row("Cache Storage", "caches" in window ? "Available" : "Not available", { mono: false }),
    row("Service workers", "serviceWorker" in navigator ? "Available" : "Not available", {
      mono: false, note: window.isSecureContext ? null : "Present but unusable — service workers require a secure context.",
    }),
  ];
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const { usage, quota } = await navigator.storage.estimate();
      rows.push(row("Storage quota", quota != null ? fmtBytes(usage || 0) + " used of " + fmtBytes(quota) : null, {
        status: "estimated", note: "The quota is a browser-managed estimate, not free disk space.",
      }));
    } else {
      rows.push(row("Storage quota", null, { status: "unavailable", note: "navigator.storage.estimate() not supported here." }));
    }
    if (navigator.storage && navigator.storage.persisted) {
      const p = await navigator.storage.persisted();
      rows.push(row("Persistent storage", p ? "Granted" : "Not granted (best-effort eviction)", { mono: false }));
    }
  } catch (e) {
    rows.push(row("Storage quota", null, { status: "unavailable", note: "The storage estimate call failed." }));
  }
  return rows;
}

// Heuristic private/incognito detection. Modern browsers deliberately make
// this undetectable, so we only ever claim "likely"/"unlikely" — never a fact.
export async function estimatePrivateMode() {
  let value = "Unknown";
  let detail = "No usable signal — this browser doesn't expose a storage estimate to compare against.";
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const { quota } = await navigator.storage.estimate();
      if (quota) {
        const localBlocked = storageWorks("localStorage") === "Blocked";
        if (localBlocked) {
          value = "Likely private / incognito";
          detail = "localStorage writes are blocked, which usually means a private window or very strict settings.";
        } else if (quota < 1.5 * 1024 * 1024 * 1024) {
          value = "Likely private / incognito";
          detail = "The storage quota is only " + fmtBytes(quota) + " — Chromium-family browsers cap the quota far below normal in private windows.";
        } else {
          value = "Probably a normal window";
          detail = "The storage quota (" + fmtBytes(quota) + ") looks typical of a regular profile.";
        }
      }
    }
  } catch (e) { /* keep Unknown */ }
  return [
    row("Private browsing", value, {
      status: "estimated", mono: false,
      note: detail + " Heuristic only — modern browsers deliberately hide private mode, so this is a guess, not a guarantee.",
    }),
  ];
}

const PERMISSIONS = [
  ["geolocation", "Geolocation"],
  ["notifications", "Notifications"],
  ["camera", "Camera"],
  ["microphone", "Microphone"],
  ["clipboard-read", "Clipboard read"],
  ["clipboard-write", "Clipboard write"],
  ["persistent-storage", "Persistent storage"],
  ["midi", "MIDI"],
];

// Passive permission states — query() never triggers a prompt.
export async function collectPermissions() {
  if (!navigator.permissions || !navigator.permissions.query) {
    return [row("Permissions API", null, { status: "unavailable", note: "navigator.permissions is not supported here." })];
  }
  const label = { granted: "Granted", denied: "Denied", prompt: "Will ask (not yet decided)" };
  const rows = await Promise.all(PERMISSIONS.map(async ([name, title]) => {
    try {
      const s = await navigator.permissions.query({ name });
      return row(title, label[s.state] || s.state, { mono: false, note: s.state === "denied" ? "Blocked for this site — change it in the browser's site settings." : null });
    } catch (e) {
      return row(title, "Not queryable", { status: "unavailable", mono: false, note: "This browser doesn't allow querying this permission passively." });
    }
  }));
  return rows;
}

// Media device counts only — labels stay hidden until permission is granted,
// and we never call getUserMedia from a diagnostics tool.
export async function collectDevices() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return [row("Media devices", null, {
      status: "unavailable",
      note: "navigator.mediaDevices is missing — usually a non-secure context or an unsupported browser.",
    })];
  }
  try {
    const list = await navigator.mediaDevices.enumerateDevices();
    const count = (kind) => list.filter((d) => d.kind === kind).length;
    const labelled = list.filter((d) => d.label).length;
    const rows = [
      row("Microphones", String(count("audioinput"))),
      row("Cameras", String(count("videoinput"))),
      row("Speakers", String(count("audiooutput")), { note: "Safari doesn't enumerate outputs, so 0 here can be normal." }),
    ];
    if (labelled === 0 && list.length > 0) {
      rows.push(row("Device names", "Hidden", {
        status: "restricted", mono: false,
        note: "Browsers hide device names until you grant camera/microphone permission — counts only, no prompt was triggered.",
      }));
    }
    return rows;
  } catch (e) {
    return [row("Media devices", null, { status: "unavailable", note: "enumerateDevices() failed: " + (e && e.message) })];
  }
}

// ------------------------------------------------- optional network lookups

// OPT-IN ONLY: this is the one function that sends a request off the device.
// freeipapi.com is primary (it has an isProxy flag); ipapi.co is the fallback.
export async function fetchNetworkIntel() {
  const estim = { status: "estimated" };
  try {
    const res = await fetch("https://freeipapi.com/api/json/");
    if (!res.ok) throw new Error("freeipapi returned " + res.status);
    const d = await res.json();
    if (!d || !d.ipAddress) throw new Error("no usable data");
    return [
      row("Public IP", d.ipAddress, estim),
      row("Location", [d.cityName, d.regionName, d.countryName].filter(Boolean).join(", ") || null, { ...estim, mono: false, note: "IP geolocation is approximate — often only city-level at best." }),
      row("ISP / Organization", d.organization || d.org || null, { ...estim, mono: false }),
      row("ASN", d.asn ? String(d.asn) : null, estim),
      row("Proxy / VPN flag", d.isProxy === true ? "Flagged as proxy" : d.isProxy === false ? "Not flagged" : null, {
        status: d.isProxy == null ? "unavailable" : "estimated", mono: false,
        note: "A provider-side heuristic — many commercial VPNs and proxies are not flagged, and false positives happen.",
      }),
      row("Source", "freeipapi.com", { mono: false }),
    ];
  } catch (primaryErr) {
    const res = await fetch("https://ipapi.co/json/");
    const d = await res.json().catch(() => null);
    if (!res.ok || !d || d.error) throw new Error((d && (d.reason || d.message)) || "Both providers failed — you may have hit a rate limit.");
    return [
      row("Public IP", d.ip, estim),
      row("Location", [d.city, d.region, d.country_name].filter(Boolean).join(", ") || null, { ...estim, mono: false, note: "IP geolocation is approximate — often only city-level at best." }),
      row("ISP / Organization", d.org || null, { ...estim, mono: false }),
      row("ASN", d.asn || null, estim),
      row("Proxy / VPN flag", null, { status: "unavailable", mono: false, note: "ipapi.co's free tier doesn't expose a proxy/VPN flag." }),
      row("Source", "ipapi.co", { mono: false }),
    ];
  }
}
