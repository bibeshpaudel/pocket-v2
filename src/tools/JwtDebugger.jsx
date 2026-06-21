// Pocket — JWT Debugger. Decodes header + payload (base64url), renders friendly
// claim times, and verifies the signature with Web Crypto — HMAC (HS*), RSA
// (RS*/PS*) and ECDSA (ES*) against a secret or a PEM public key. 100% client
// side; nothing leaves the browser. Composes design-system primitives + tokens.
import React from "react";
import { Panel } from "../../Pocket Design System/components/surfaces/Panel.jsx";
import { Textarea } from "../../Pocket Design System/components/forms/Textarea.jsx";
import { Badge } from "../../Pocket Design System/components/core/Badge.jsx";
import { Button } from "../../Pocket Design System/components/core/Button.jsx";
import { IconButton } from "../../Pocket Design System/components/core/IconButton.jsx";
import { CopyButton } from "../../Pocket Design System/components/core/CopyButton.jsx";
import { Switch } from "../../Pocket Design System/components/forms/Switch.jsx";
import { SegmentedControl } from "../../Pocket Design System/components/forms/SegmentedControl.jsx";
import { Icon } from "../../Pocket Design System/components/core/Icon.jsx";
import { pocketHighlightJSON } from "../tools-data.js";

const enc = new TextEncoder();
const dec = new TextDecoder();
const HASH = { 256: "SHA-256", 384: "SHA-384", 512: "SHA-512" };

// A jwt.io-style HS256 sample (secret: "pocket-secret").
const SAMPLE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlBvY2tldCBVc2VyIiwiYWRtaW4iOnRydWUsImlhdCI6MTcxODg2NDAwMCwiZXhwIjoyMDM0NDI0MDAwfQ." +
  "0Yd0n2t7wU2u3l3yQ9j9F0Yt0xg8nq8C4y3wq6mJ2c";

function b64urlToBytes(str) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 2 ? "==" : b64.length % 4 === 3 ? "=" : "";
  const bin = atob(b64 + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function b64urlToString(str) {
  return dec.decode(b64urlToBytes(str));
}
function pemToBytes(pem) {
  const body = pem.replace(/-----BEGIN [^-]+-----/g, "").replace(/-----END [^-]+-----/g, "").replace(/\s+/g, "");
  if (!body) throw new Error("No PEM body found.");
  return b64urlToBytes(body);
}
function bytesToB64url(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function strToB64url(str) {
  return bytesToB64url(enc.encode(str));
}
function pretty(obj) {
  return JSON.stringify(obj, null, 2);
}
function algInfo(alg) {
  const m = /^(HS|RS|PS|ES)(256|384|512)$/.exec(alg || "");
  if (!m) return null;
  return { family: m[1], bits: m[2], hash: HASH[m[2]] };
}

async function verifySignature(token, alg, secret, secretIsB64) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Not a three-part JWT.");
  const [h, p, s] = parts;
  if (alg === "none") return { kind: "none" };
  const info = algInfo(alg);
  if (!info) throw new Error(`Unsupported algorithm: ${alg || "(missing)"}`);
  if (!secret.trim()) return { kind: "nokey" };

  const data = enc.encode(`${h}.${p}`);
  const sig = b64urlToBytes(s);

  if (info.family === "HS") {
    const keyData = secretIsB64 ? b64urlToBytes(secret.trim()) : enc.encode(secret);
    const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: info.hash }, false, ["verify"]);
    return { kind: await crypto.subtle.verify("HMAC", key, sig, data) ? "valid" : "invalid" };
  }

  const keyBytes = pemToBytes(secret);
  let importAlgo, verifyAlgo;
  if (info.family === "RS") {
    importAlgo = { name: "RSASSA-PKCS1-v1_5", hash: info.hash };
    verifyAlgo = { name: "RSASSA-PKCS1-v1_5" };
  } else if (info.family === "PS") {
    importAlgo = { name: "RSA-PSS", hash: info.hash };
    verifyAlgo = { name: "RSA-PSS", saltLength: Number(info.bits) / 8 };
  } else {
    const curve = { 256: "P-256", 384: "P-384", 512: "P-521" }[info.bits];
    importAlgo = { name: "ECDSA", namedCurve: curve };
    verifyAlgo = { name: "ECDSA", hash: info.hash };
  }
  const key = await crypto.subtle.importKey("spki", keyBytes, importAlgo, false, ["verify"]);
  return { kind: await crypto.subtle.verify(verifyAlgo, key, sig, data) ? "valid" : "invalid" };
}

async function signJwt(headerObj, payloadObj, secret, secretIsB64) {
  const alg = headerObj.alg;
  const signingInput = `${strToB64url(JSON.stringify(headerObj))}.${strToB64url(JSON.stringify(payloadObj))}`;
  if (alg === "none") return `${signingInput}.`;
  const info = algInfo(alg);
  if (!info) throw new Error(`Unsupported "alg": ${alg || "(missing)"}`);
  if (!secret.trim()) throw new Error(info.family === "HS" ? "Enter a secret to sign." : "Paste a PEM private key to sign.");

  const data = enc.encode(signingInput);
  let sigBytes;
  if (info.family === "HS") {
    const keyData = secretIsB64 ? b64urlToBytes(secret.trim()) : enc.encode(secret);
    const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: info.hash }, false, ["sign"]);
    sigBytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, data));
  } else {
    const keyBytes = pemToBytes(secret); // PKCS#8 private key
    let importAlgo, signAlgo;
    if (info.family === "RS") {
      importAlgo = { name: "RSASSA-PKCS1-v1_5", hash: info.hash };
      signAlgo = { name: "RSASSA-PKCS1-v1_5" };
    } else if (info.family === "PS") {
      importAlgo = { name: "RSA-PSS", hash: info.hash };
      signAlgo = { name: "RSA-PSS", saltLength: Number(info.bits) / 8 };
    } else {
      const curve = { 256: "P-256", 384: "P-384", 512: "P-521" }[info.bits];
      importAlgo = { name: "ECDSA", namedCurve: curve };
      signAlgo = { name: "ECDSA", hash: info.hash };
    }
    const key = await crypto.subtle.importKey("pkcs8", keyBytes, importAlgo, false, ["sign"]);
    sigBytes = new Uint8Array(await crypto.subtle.sign(signAlgo, key, data));
  }
  return `${signingInput}.${bytesToB64url(sigBytes)}`;
}

function fmtTime(sec) {
  const d = new Date(sec * 1000);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString();
}
function relative(sec) {
  const diff = sec * 1000 - Date.now();
  const abs = Math.abs(diff);
  const units = [["year", 31536e6], ["day", 864e5], ["hour", 36e5], ["minute", 6e4], ["second", 1e3]];
  for (const [name, ms] of units) {
    if (abs >= ms || name === "second") {
      const n = Math.round(abs / ms);
      return diff >= 0 ? `in ${n} ${name}${n === 1 ? "" : "s"}` : `${n} ${name}${n === 1 ? "" : "s"} ago`;
    }
  }
  return "";
}

const TIME_CLAIMS = { exp: "Expires", iat: "Issued at", nbf: "Not before", auth_time: "Auth time" };

function ClaimRow({ label, value, sub, kind }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderTop: "1px solid var(--border-subtle)" }}>
      <span style={{ fontSize: 12, color: "var(--text-tertiary)", width: 96, flex: "none" }}>{label}</span>
      <span style={{ fontSize: 13, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{value}</span>
      {sub ? <span style={{ marginLeft: "auto" }}>{kind ? <Badge kind={kind}>{sub}</Badge> : <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{sub}</span>}</span> : null}
    </div>
  );
}

function CodePane({ html }) {
  return (
    <pre style={{ margin: 0, padding: "12px 16px", overflow: "auto", flex: 1, minHeight: 0, fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.6, color: "var(--code-fg)" }}
      dangerouslySetInnerHTML={{ __html: html }} />
  );
}

const SAMPLE_HEADER = '{\n  "alg": "HS256",\n  "typ": "JWT"\n}';
const SAMPLE_PAYLOAD = '{\n  "sub": "1234567890",\n  "name": "Pocket User",\n  "admin": true,\n  "iat": 1718864000,\n  "exp": 2034424000\n}';

export default function JwtDebuggerScreen() {
  const [mode, setMode] = React.useState("Decode");
  const [token, setToken] = React.useState(SAMPLE);
  const [secret, setSecret] = React.useState("pocket-secret");
  const [secretB64, setSecretB64] = React.useState(false);
  const [verify, setVerify] = React.useState({ status: "idle" });

  // Encode mode state
  const [headerText, setHeaderText] = React.useState(SAMPLE_HEADER);
  const [payloadText, setPayloadText] = React.useState(SAMPLE_PAYLOAD);
  const [signSecret, setSignSecret] = React.useState("pocket-secret");
  const [signB64, setSignB64] = React.useState(false);
  const [encoded, setEncoded] = React.useState({ status: "idle" });

  const decoded = React.useMemo(() => {
    const raw = token.trim();
    if (!raw) return { empty: true };
    const parts = raw.split(".");
    if (parts.length < 2) return { error: "A JWT needs at least a header and payload separated by dots." };
    try {
      const header = JSON.parse(b64urlToString(parts[0]));
      const payload = JSON.parse(b64urlToString(parts[1]));
      return { header, payload, alg: header.alg, hasSig: parts.length === 3 && !!parts[2] };
    } catch (e) {
      return { error: "Could not decode — the header or payload isn't valid base64url JSON." };
    }
  }, [token]);

  const alg = decoded.alg;
  const info = algInfo(alg);
  const isHmac = info && info.family === "HS";

  React.useEffect(() => {
    if (mode !== "Decode") return undefined;
    if (decoded.empty || decoded.error) { setVerify({ status: "idle" }); return undefined; }
    let cancelled = false;
    setVerify({ status: "verifying" });
    const handler = setTimeout(async () => {
      try {
        const r = await verifySignature(token.trim(), alg, secret, secretB64);
        if (!cancelled) setVerify({ status: r.kind });
      } catch (e) {
        if (!cancelled) setVerify({ status: "error", message: (e && e.message) || String(e) });
      }
    }, 200);
    return () => { cancelled = true; clearTimeout(handler); };
  }, [mode, token, alg, secret, secretB64, decoded.empty, decoded.error]);

  // Encode: parse the two JSON editors, then sign (debounced, async).
  const encParsed = React.useMemo(() => {
    try {
      const header = JSON.parse(headerText);
      if (!header || typeof header !== "object" || Array.isArray(header)) throw new Error("Header must be a JSON object.");
      const payload = JSON.parse(payloadText);
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Payload must be a JSON object.");
      return { header, payload };
    } catch (e) {
      return { error: (e && e.message) || "Invalid JSON." };
    }
  }, [headerText, payloadText]);

  const encAlg = encParsed.header ? encParsed.header.alg : undefined;
  const encInfo = algInfo(encAlg);
  const encIsHmac = encInfo && encInfo.family === "HS";

  React.useEffect(() => {
    if (mode !== "Encode") return undefined;
    if (encParsed.error) { setEncoded({ status: "error", message: encParsed.error }); return undefined; }
    let cancelled = false;
    setEncoded({ status: "signing" });
    const handler = setTimeout(async () => {
      try {
        const jwt = await signJwt(encParsed.header, encParsed.payload, signSecret, signB64);
        if (!cancelled) setEncoded({ status: "ok", jwt });
      } catch (e) {
        if (!cancelled) setEncoded({ status: "error", message: (e && e.message) || String(e) });
      }
    }, 200);
    return () => { cancelled = true; clearTimeout(handler); };
  }, [mode, headerText, payloadText, signSecret, signB64, encParsed.error, encAlg]);

  const setNow = (key) => {
    try {
      const p = JSON.parse(payloadText);
      p[key] = Math.floor(Date.now() / 1000) + (key === "exp" ? 3600 : 0);
      setPayloadText(JSON.stringify(p, null, 2));
    } catch (e) { /* ignore while JSON is mid-edit */ }
  };

  // Registered time claims + validity
  const claims = [];
  let validityBadge = null;
  if (decoded.payload) {
    const now = Date.now() / 1000;
    for (const key of ["iat", "nbf", "exp", "auth_time"]) {
      const v = decoded.payload[key];
      if (typeof v === "number") {
        const expired = key === "exp" && v < now;
        const notYet = key === "nbf" && v > now;
        claims.push({ label: TIME_CLAIMS[key], value: fmtTime(v) || String(v), sub: relative(v), kind: expired || notYet ? "warn" : undefined });
      }
    }
    if (typeof decoded.payload.exp === "number" && decoded.payload.exp < now) validityBadge = <Badge kind="danger" dot>Expired</Badge>;
    else if (typeof decoded.payload.nbf === "number" && decoded.payload.nbf > now) validityBadge = <Badge kind="warn" dot>Not yet valid</Badge>;
    else validityBadge = <Badge kind="ok" dot>Within validity window</Badge>;
  }

  const V = verify.status;
  const sigMeta = V === "valid" ? <Badge kind="ok" dot>Signature verified</Badge>
    : V === "invalid" ? <Badge kind="danger" dot>Invalid signature</Badge>
    : V === "none" ? <Badge kind="warn">alg: none — unsigned</Badge>
    : V === "nokey" ? <Badge kind="neutral">{isHmac ? "Enter secret to verify" : "Paste public key to verify"}</Badge>
    : V === "error" ? <Badge kind="danger">Verify error</Badge>
    : V === "verifying" ? <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>checking…</span>
    : null;

  const E = encoded.status;
  const encMeta = E === "ok" ? <Badge kind="ok" dot>Signed</Badge>
    : E === "error" ? <Badge kind="danger">{encParsed.error ? "Invalid JSON" : "Sign error"}</Badge>
    : E === "signing" ? <span style={{ fontSize: 12, color: "var(--syn-comment)" }}>signing…</span>
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <SegmentedControl options={["Decode", "Encode"]} value={mode} onChange={setMode} />
        <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
          {mode === "Decode" ? "Inspect & verify an existing token" : "Build & sign a token from claims"}
        </span>
      </div>

      {mode === "Decode" ? (
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Left: encoded token + verification */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
          <Panel title="Encoded" variant="sunken" meta={token.length.toLocaleString() + " chars"}
            actions={
              <span style={{ display: "flex", gap: 6 }}>
                <IconButton icon="rotate-ccw" label="Load sample" size="sm" onClick={() => { setToken(SAMPLE); setSecret("pocket-secret"); setSecretB64(false); }} />
                <IconButton icon="x" label="Clear" size="sm" onClick={() => setToken("")} />
              </span>
            } style={{ flex: 1, minHeight: 0 }}>
            <Textarea bare mono value={token} onChange={(e) => setToken(e.target.value)}
              placeholder="Paste a JWT (header.payload.signature)…"
              style={{ flex: 1, padding: "12px 14px", minHeight: 0, wordBreak: "break-all" }} />
          </Panel>

          <Panel title="Verify signature" variant="raised" meta={alg ? <Badge kind="accent">{alg}</Badge> : null} style={{ flex: "none" }}>
            <div style={{ padding: "12px 16px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 22 }}>
                <Icon name={V === "valid" ? "shield-check" : V === "invalid" || V === "error" ? "shield-x" : "shield"} size={16}
                  style={{ color: V === "valid" ? "var(--ok)" : V === "invalid" || V === "error" ? "var(--danger)" : "var(--text-tertiary)" }} />
                {sigMeta}
              </div>
              {info ? (
                <>
                  <Textarea value={secret} onChange={(e) => setSecret(e.target.value)}
                    placeholder={isHmac ? "HMAC secret…" : "-----BEGIN PUBLIC KEY----- (PEM, SPKI)…"}
                    rows={isHmac ? 2 : 5}
                    style={{ minHeight: 0, wordBreak: "break-all" }} />
                  {isHmac ? (
                    <Switch checked={secretB64} onChange={setSecretB64} label="Secret is base64url-encoded" />
                  ) : (
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Paste the issuer's <strong>public</strong> key (PEM / SPKI). Private keys aren't needed and never should be pasted anywhere.</div>
                  )}
                  {V === "error" ? <div style={{ fontSize: 12, color: "var(--danger)", fontFamily: "var(--font-mono)" }}>{verify.message}</div> : null}
                </>
              ) : alg === "none" ? (
                <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>This token declares <code>alg: none</code> — it carries no signature and anyone can forge it.</div>
              ) : (
                <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Decode a token to verify its signature.</div>
              )}
            </div>
          </Panel>
        </div>

        {/* Right: decoded header / payload / claims */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
          {decoded.error ? (
            <Panel title="Decoded" variant="code" style={{ flex: 1, minHeight: 0 }}>
              <div style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.6, color: "#E08A76" }}>{decoded.error}</div>
            </Panel>
          ) : decoded.empty ? (
            <Panel title="Decoded" variant="code" style={{ flex: 1, minHeight: 0 }}>
              <div style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--syn-comment)" }}>Paste a token to decode it.</div>
            </Panel>
          ) : (
            <>
              <Panel title="Header" variant="code" meta={<Badge kind="neutral">{Object.keys(decoded.header).length} keys</Badge>}
                actions={<CopyButton onDark getText={() => pretty(decoded.header)} />} style={{ flex: "none", maxHeight: "30%" }}>
                <CodePane html={pocketHighlightJSON(pretty(decoded.header))} />
              </Panel>
              <Panel title="Payload" variant="code" meta={validityBadge}
                actions={<CopyButton onDark getText={() => pretty(decoded.payload)} />} style={{ flex: 1, minHeight: 0 }}>
                <CodePane html={pocketHighlightJSON(pretty(decoded.payload))} />
              </Panel>
              {claims.length ? (
                <Panel title="Time claims" variant="raised" style={{ flex: "none" }}>
                  <div style={{ padding: "2px 16px 12px" }}>
                    {claims.map((c, i) => <ClaimRow key={i} {...c} />)}
                  </div>
                </Panel>
              ) : null}
            </>
          )}
        </div>
      </div>
      ) : (
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Left: editable header + payload + signing key */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
          <Panel title="Header" variant="sunken" meta={encParsed.error && !encParsed.header ? <Badge kind="danger">JSON?</Badge> : null}
            actions={<IconButton icon="rotate-ccw" label="Reset header" size="sm" onClick={() => setHeaderText(SAMPLE_HEADER)} />}
            style={{ flex: "none", height: "30%" }}>
            <Textarea bare value={headerText} onChange={(e) => setHeaderText(e.target.value)}
              placeholder='{ "alg": "HS256", "typ": "JWT" }'
              style={{ flex: 1, padding: "12px 14px", minHeight: 0 }} />
          </Panel>

          <Panel title="Payload" variant="sunken"
            actions={
              <span style={{ display: "flex", gap: 6 }}>
                <Button variant="ghost" size="sm" onClick={() => setNow("iat")}>iat = now</Button>
                <Button variant="ghost" size="sm" onClick={() => setNow("exp")}>exp = +1h</Button>
                <IconButton icon="rotate-ccw" label="Reset payload" size="sm" onClick={() => setPayloadText(SAMPLE_PAYLOAD)} />
              </span>
            } style={{ flex: 1, minHeight: 0 }}>
            <Textarea bare value={payloadText} onChange={(e) => setPayloadText(e.target.value)}
              placeholder='{ "sub": "1234567890" }'
              style={{ flex: 1, padding: "12px 14px", minHeight: 0 }} />
          </Panel>

          <Panel title="Sign with" variant="raised" meta={encAlg ? <Badge kind="accent">{encAlg}</Badge> : null} style={{ flex: "none" }}>
            <div style={{ padding: "12px 16px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
              {encAlg === "none" ? (
                <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Header declares <code>alg: none</code> — the token will be emitted unsigned (empty signature).</div>
              ) : encInfo ? (
                <>
                  <Textarea value={signSecret} onChange={(e) => setSignSecret(e.target.value)}
                    placeholder={encIsHmac ? "HMAC secret…" : "-----BEGIN PRIVATE KEY----- (PEM, PKCS#8)…"}
                    rows={encIsHmac ? 2 : 5} style={{ minHeight: 0, wordBreak: "break-all" }} />
                  {encIsHmac ? (
                    <Switch checked={signB64} onChange={setSignB64} label="Secret is base64url-encoded" />
                  ) : (
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Signing needs the <strong>private</strong> key (PEM / PKCS#8). It stays in your browser — but never paste a production key into any web tool.</div>
                  )}
                </>
              ) : (
                <div style={{ fontSize: 12, color: "var(--danger)", fontFamily: "var(--font-mono)" }}>
                  {encParsed.error ? encParsed.error : `Unsupported "alg": ${encAlg || "(set one in the header)"}`}
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* Right: signed token output */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
          <Panel title="Signed JWT" variant="code" meta={encMeta}
            actions={E === "ok" ? <CopyButton onDark getText={() => encoded.jwt} /> : null} style={{ flex: 1, minHeight: 0 }}>
            {E === "error" ? (
              <div style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.6, color: "#E08A76" }}>{encoded.message}</div>
            ) : (
              <pre style={{ margin: 0, padding: "12px 16px", overflow: "auto", flex: 1, minHeight: 0, fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.7, color: "var(--code-fg)", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{E === "ok" ? encoded.jwt : ""}</pre>
            )}
          </Panel>
          <div style={{ fontSize: 12, color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="info" size={12} /> Edit the header/payload as JSON; the token re-signs automatically. Switch to <strong>Decode</strong> to verify it.
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
