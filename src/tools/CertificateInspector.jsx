// Pocket — Certificate Inspector. Parses X.509 certs (PEM/DER) with
// @peculiar/x509 and verifies arbitrary signatures with Web Crypto. 100%
// client-side — for developer debugging only. It does NOT check trust chains or
// revocation (see the disclaimer banner). DS primitives + tokens only.
import React from "react";
import * as x509 from "@peculiar/x509";
import { Panel } from "../../Pocket Design System/components/surfaces/Panel.jsx";
import { Textarea } from "../../Pocket Design System/components/forms/Textarea.jsx";
import { Badge } from "../../Pocket Design System/components/core/Badge.jsx";
import { Button } from "../../Pocket Design System/components/core/Button.jsx";
import { IconButton } from "../../Pocket Design System/components/core/IconButton.jsx";
import { CopyButton } from "../../Pocket Design System/components/core/CopyButton.jsx";
import { Select } from "../../Pocket Design System/components/forms/Select.jsx";
import { SegmentedControl } from "../../Pocket Design System/components/forms/SegmentedControl.jsx";
import { Icon } from "../../Pocket Design System/components/core/Icon.jsx";
import { pocketHighlightJSON } from "../tools-data.js";

// Use the browser's WebCrypto for all @peculiar/x509 async ops (export/thumbprint).
if (typeof crypto !== "undefined") { try { x509.cryptoProvider.set(crypto); } catch (e) { /* already set */ } }

const enc = new TextEncoder();

// ---- helpers --------------------------------------------------------------

function readArrayBuffer(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(new Error("Could not read file")); r.readAsArrayBuffer(file); }); }

function pemToBytes(pem) {
  const body = pem.replace(/-----BEGIN [^-]+-----/g, "").replace(/-----END [^-]+-----/g, "").replace(/\s+/g, "");
  if (!body) throw new Error("No PEM body found.");
  const bin = atob(body);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function hexToBytes(hex) {
  const s = hex.replace(/[\s:]+/g, "");
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(s.substr(i * 2, 2), 16);
  return out;
}
function b64ToBytes(b64) {
  const bin = atob(b64.replace(/\s+/g, ""));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function decodeSig(str) {
  const s = str.trim().replace(/[\s:]+/g, "");
  if (/^[0-9a-fA-F]+$/.test(s) && s.length % 2 === 0) return hexToBytes(s);
  return b64ToBytes(s);
}
function bufToHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join(":");
}
// DER-encoded ECDSA signature (SEQUENCE{r,s}) → raw r||s that WebCrypto expects.
function derToRawEcdsa(der, size) {
  let o = 0;
  if (der[o++] !== 0x30) throw new Error("bad DER");
  if (der[o] & 0x80) o += (der[o] & 0x7f) + 1; else o++;
  const readInt = () => { if (der[o++] !== 0x02) throw new Error("bad DER int"); let len = der[o++]; let b = der.slice(o, o + len); o += len; while (b.length > size) b = b.slice(1); return b; };
  const r = readInt(), s = readInt();
  const out = new Uint8Array(size * 2);
  out.set(r, size - r.length); out.set(s, size * 2 - s.length);
  return out;
}

function dnField(dn, key) { const m = new RegExp("(?:^|,\\s*)" + key + "=([^,]+)").exec(dn || ""); return m ? m[1].trim() : null; }

function humanizeUntil(date) {
  const ms = date.getTime() - Date.now();
  const past = ms < 0; const abs = Math.abs(ms);
  const d = Math.floor(abs / 864e5), h = Math.floor((abs % 864e5) / 36e5);
  const str = d >= 1 ? `${d} day${d === 1 ? "" : "s"}${h ? ` ${h}h` : ""}` : `${h} hour${h === 1 ? "" : "s"}`;
  return past ? `${str} ago` : `in ${str}`;
}

function sigAlgName(a) {
  if (!a) return "—";
  const hash = a.hash && a.hash.name ? a.hash.name : "";
  const map = { "RSASSA-PKCS1-v1_5": "RSA", "RSA-PSS": "RSA-PSS", "ECDSA": "ECDSA" };
  return `${map[a.name] || a.name}${hash ? " / " + hash : ""}`;
}

async function keyInfo(cert) {
  try {
    const ck = await cert.publicKey.export();
    const a = ck.algorithm;
    if (a.name.includes("RSA")) return `RSA · ${a.modulusLength}-bit`;
    if (a.name.includes("EC")) return `EC · ${a.namedCurve}`;
    return a.name;
  } catch (e) {
    return (cert.publicKey.algorithm && cert.publicKey.algorithm.name) || "—";
  }
}

function parseCerts(input) {
  const blocks = input.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g);
  const list = blocks && blocks.length ? blocks : [input.trim()];
  return list.map((b) => new x509.X509Certificate(b));
}

// ---- verification ---------------------------------------------------------

const HASH_SALT = { "SHA-256": 32, "SHA-384": 48, "SHA-512": 64 };
const EC_SIZE = { "P-256": 32, "P-384": 48, "P-521": 66 };

async function importPub(pem, family, hash) {
  const der = pemToBytes(pem);
  if (family === "ECDSA") {
    for (const namedCurve of ["P-256", "P-384", "P-521"]) {
      try { return { key: await crypto.subtle.importKey("spki", der, { name: "ECDSA", namedCurve }, false, ["verify"]), namedCurve }; } catch (e) { /* try next */ }
    }
    throw new Error("Couldn't import that EC public key.");
  }
  return { key: await crypto.subtle.importKey("spki", der, { name: family, hash }, false, ["verify"]) };
}

async function verifySig({ data, sigText, pem, family, hash }) {
  const { key, namedCurve } = await importPub(pem, family, hash);
  let sig = decodeSig(sigText);
  let algo;
  if (family === "ECDSA") {
    if (sig[0] === 0x30) sig = derToRawEcdsa(sig, EC_SIZE[namedCurve]); // accept openssl DER sigs
    algo = { name: "ECDSA", hash };
  } else if (family === "RSA-PSS") {
    algo = { name: "RSA-PSS", saltLength: HASH_SALT[hash] };
  } else {
    algo = { name: "RSASSA-PKCS1-v1_5" };
  }
  return crypto.subtle.verify(algo, key, sig, data);
}

// ---- small UI pieces ------------------------------------------------------

function Disclaimer() {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: "var(--warn-soft)", border: "1px solid var(--warn)", borderRadius: "var(--radius-md)" }}>
      <Icon name="triangle-alert" size={16} style={{ color: "var(--warn)", flex: "none", marginTop: 1 }} />
      <span style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>
        This tool performs <strong>client-side inspection only</strong>. It does <strong>not</strong> verify certificate trust chains or revocation status. Do not use it for security-critical decisions.
      </span>
    </div>
  );
}

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

// ---- inspect view ---------------------------------------------------------

function InspectView() {
  const [text, setText] = React.useState("");
  const [idx, setIdx] = React.useState(0);
  const [extra, setExtra] = React.useState(null);

  const parsed = React.useMemo(() => {
    if (!text.trim()) return { empty: true };
    try { return { certs: parseCerts(text) }; }
    catch (e) { return { error: "Couldn't parse a certificate from this input. Paste PEM/Base64 or open a .pem/.crt/.cer/.der file." }; }
  }, [text]);

  const certs = parsed.certs || [];
  const cert = certs[Math.min(idx, certs.length - 1)] || null;

  React.useEffect(() => {
    if (!cert) { setExtra(null); return undefined; }
    let cancelled = false;
    setExtra(null);
    (async () => {
      const [pk, sha256, sha1] = await Promise.all([
        keyInfo(cert),
        cert.getThumbprint("SHA-256").then(bufToHex).catch(() => null),
        cert.getThumbprint("SHA-1").then(bufToHex).catch(() => null),
      ]);
      if (!cancelled) setExtra({ pk, sha256, sha1 });
    })();
    return () => { cancelled = true; };
  }, [cert]);

  const openFile = async (file) => {
    try {
      const buf = await readArrayBuffer(file);
      const head = new TextDecoder().decode(new Uint8Array(buf).slice(0, 40));
      const pem = head.includes("-----BEGIN") ? new TextDecoder().decode(buf) : new x509.X509Certificate(buf).toString("pem");
      setIdx(0); setText(pem);
    } catch (e) { setText("Couldn't read that file as a certificate."); }
  };

  let validity = null;
  if (cert) {
    const now = Date.now();
    if (now < cert.notBefore.getTime()) validity = { kind: "warn", label: "Not yet valid", note: "Starts " + humanizeUntil(cert.notBefore) };
    else if (now > cert.notAfter.getTime()) validity = { kind: "danger", label: "Expired", note: "Expired " + humanizeUntil(cert.notAfter) };
    else if (cert.notAfter.getTime() - now < 30 * 864e5) validity = { kind: "warn", label: "Expiring soon", note: "Expires " + humanizeUntil(cert.notAfter) };
    else validity = { kind: "ok", label: "Valid", note: "Expires " + humanizeUntil(cert.notAfter) };
  }

  const san = cert ? (() => { try { const e = cert.getExtension(x509.SubjectAlternativeNameExtension); return e ? e.names.items.map((n) => n.value) : []; } catch (x) { return []; } })() : [];
  const bc = cert ? (() => { try { return cert.getExtension(x509.BasicConstraintsExtension); } catch (x) { return null; } })() : null;

  const jsonObj = cert ? {
    subject: cert.subject, issuer: cert.issuer,
    serialNumber: cert.serialNumber,
    notBefore: cert.notBefore.toISOString(), notAfter: cert.notAfter.toISOString(),
    signatureAlgorithm: sigAlgName(cert.signatureAlgorithm),
    publicKey: extra ? extra.pk : "…",
    subjectAltNames: san, isCA: bc ? bc.ca : undefined,
    sha256Fingerprint: extra ? extra.sha256 : "…",
  } : null;

  return (
    <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "minmax(0, 1fr)", gap: 14 }}>
      {/* input */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) openFile(f); }}
        style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
        <Panel title="Certificate input" variant="sunken" meta={certs.length > 1 ? <Badge kind="neutral">{certs.length} certs</Badge> : null}
          actions={
            <span style={{ display: "flex", gap: 6 }}>
              <label>
                <input type="file" accept=".pem,.crt,.cer,.der,application/x-x509-ca-cert" onChange={(e) => { if (e.target.files[0]) openFile(e.target.files[0]); e.target.value = ""; }} style={{ display: "none" }} />
                <IconButton icon="upload" label="Open file" size="sm" onClick={(e) => e.currentTarget.previousSibling.click()} />
              </label>
              <IconButton icon="x" label="Clear" size="sm" onClick={() => { setText(""); setIdx(0); }} />
            </span>
          } style={{ flex: 1, minHeight: 0 }}>
          <Textarea bare mono value={text} onChange={(e) => setText(e.target.value)}
            placeholder={"Paste a certificate (-----BEGIN CERTIFICATE-----…), or drop / open a .pem/.crt/.cer/.der file"}
            style={{ flex: 1, padding: "12px 14px", minHeight: 0 }} />
        </Panel>
        {certs.length > 1 ? (
          <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Certificate in chain</span>
            <Select value={String(idx)} onChange={(e) => setIdx(Number(e.target.value))}
              options={certs.map((c, i) => ({ value: String(i), label: `${i + 1}. ${dnField(c.subject, "CN") || c.subject.slice(0, 40)}` }))} />
          </div>
        ) : null}
      </div>

      {/* output */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0, overflowY: "auto" }}>
        {parsed.empty ? (
          <Panel title="Details" variant="code" style={{ flex: 1, minHeight: 0 }}>
            <div style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--syn-comment)" }}>Paste or open a certificate to inspect it.</div>
          </Panel>
        ) : parsed.error ? (
          <Panel title="Details" variant="code" style={{ flex: 1, minHeight: 0 }}>
            <div style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.6, color: "#E08A76" }}>{parsed.error}</div>
          </Panel>
        ) : (
          <>
            <Section title="Validity" meta={validity ? <Badge kind={validity.kind} dot>{validity.label}</Badge> : null}>
              <Row label="Status" mono={false}>{validity.note}</Row>
              <Row label="Valid from" value={cert.notBefore.toLocaleString()} mono={false} />
              <Row label="Valid to" value={cert.notAfter.toLocaleString()} mono={false} />
            </Section>

            <Section title="Subject">
              <Row label="Common name" value={dnField(cert.subject, "CN")} mono={false} />
              <Row label="Organization" value={dnField(cert.subject, "O")} mono={false} />
              <Row label="Org unit" value={dnField(cert.subject, "OU")} mono={false} />
              <Row label="Country" value={dnField(cert.subject, "C")} mono={false} />
              <Row label="Full DN" value={cert.subject} />
              {san.length ? <Row label="Alt names" value={san.join(", ")} /> : null}
            </Section>

            <Section title="Issuer">
              <Row label="Common name" value={dnField(cert.issuer, "CN")} mono={false} />
              <Row label="Organization" value={dnField(cert.issuer, "O")} mono={false} />
              <Row label="Full DN" value={cert.issuer} />
            </Section>

            <Section title="Details">
              <Row label="Serial number" value={cert.serialNumber} />
              <Row label="Signature alg" value={sigAlgName(cert.signatureAlgorithm)} />
              <Row label="Public key" value={extra ? extra.pk : "…"} />
              <Row label="Basic cons." value={bc ? (bc.ca ? "CA: true" + (bc.pathLength != null ? `, pathLen ${bc.pathLength}` : "") : "CA: false") : null} mono={false} />
              <Row label="SHA-256 fp" value={extra ? extra.sha256 : "…"} />
              <Row label="SHA-1 fp" value={extra ? extra.sha1 : "…"} />
            </Section>

            <Panel title="JSON" variant="code" actions={<CopyButton onDark getText={() => JSON.stringify(jsonObj, null, 2)} />} style={{ flex: "none" }}>
              <pre style={{ margin: 0, padding: "12px 16px", overflow: "auto", fontFamily: "var(--font-mono)", fontSize: 12.5, lineHeight: 1.6, color: "var(--code-fg)" }}
                dangerouslySetInnerHTML={{ __html: pocketHighlightJSON(JSON.stringify(jsonObj, null, 2)) }} />
            </Panel>
          </>
        )}
      </div>
    </div>
  );
}

// ---- verify view ----------------------------------------------------------

function VerifyView() {
  const [dataText, setDataText] = React.useState("");
  const [dataFile, setDataFile] = React.useState(null); // { name, bytes }
  const [sigText, setSigText] = React.useState("");
  const [pem, setPem] = React.useState("");
  const [family, setFamily] = React.useState("RSASSA-PKCS1-v1_5");
  const [hash, setHash] = React.useState("SHA-256");
  const [result, setResult] = React.useState({ status: "idle" });

  const run = async () => {
    if (!sigText.trim() || !pem.trim()) { setResult({ status: "error", message: "Provide a signature and a public key." }); return; }
    setResult({ status: "working" });
    try {
      const data = dataFile ? dataFile.bytes : enc.encode(dataText);
      const ok = await verifySig({ data, sigText, pem, family, hash });
      setResult({ status: ok ? "valid" : "invalid" });
    } catch (e) {
      setResult({ status: "error", message: (e && e.message) || String(e) });
    }
  };

  const loadData = async (file) => { try { setDataFile({ name: file.name, bytes: new Uint8Array(await readArrayBuffer(file)) }); } catch (e) { /* ignore */ } };

  const R = result.status;
  const box = { padding: "10px 12px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", background: "var(--surface-sunken)", minHeight: 0, wordBreak: "break-all" };

  return (
    <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "minmax(0, 1fr)", gap: 14 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 0, overflowY: "auto" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Data</span>
            <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              {dataFile ? <Badge kind="neutral">{dataFile.name}</Badge> : null}
              <label>
                <input type="file" onChange={(e) => { if (e.target.files[0]) loadData(e.target.files[0]); e.target.value = ""; }} style={{ display: "none" }} />
                <Button variant="ghost" size="sm" icon="upload" onClick={(e) => e.currentTarget.previousSibling.click()}>{dataFile ? "Replace" : "File"}</Button>
              </label>
              {dataFile ? <Button variant="ghost" size="sm" icon="x" onClick={() => setDataFile(null)}>Use text</Button> : null}
            </span>
          </div>
          {dataFile ? (
            <div style={{ ...box, fontSize: 12, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>{dataFile.bytes.length.toLocaleString()} bytes — file is the signed data</div>
          ) : (
            <Textarea value={dataText} onChange={(e) => setDataText(e.target.value)} placeholder="The original data that was signed…" rows={4} style={{ minHeight: 0 }} />
          )}
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Signature <span style={{ fontWeight: 400, color: "var(--text-tertiary)" }}>(Base64 or hex)</span></div>
          <Textarea value={sigText} onChange={(e) => setSigText(e.target.value)} placeholder="Base64 or hex signature…" rows={3} style={{ minHeight: 0, wordBreak: "break-all" }} />
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Public key <span style={{ fontWeight: 400, color: "var(--text-tertiary)" }}>(PEM / SPKI)</span></div>
          <Textarea value={pem} onChange={(e) => setPem(e.target.value)} placeholder="-----BEGIN PUBLIC KEY-----…" rows={5} style={{ minHeight: 0, wordBreak: "break-all" }} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
        <Section title="Algorithm">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, paddingTop: 8 }}>
            <Select value={family} onChange={(e) => setFamily(e.target.value)} options={[
              { value: "RSASSA-PKCS1-v1_5", label: "RSA (PKCS#1 v1.5)" },
              { value: "RSA-PSS", label: "RSA-PSS" },
              { value: "ECDSA", label: "ECDSA" },
            ]} />
            <Select value={hash} onChange={(e) => setHash(e.target.value)} options={["SHA-256", "SHA-384", "SHA-512"].map((h) => ({ value: h, label: h }))} />
            <Button variant="primary" icon="shield-check" onClick={run} disabled={R === "working"}>{R === "working" ? "Verifying…" : "Verify"}</Button>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-tertiary)", paddingTop: 10 }}>ECDSA accepts both raw (P1363) and DER (OpenSSL) signatures. The curve is detected from the key.</div>
        </Section>

        <Panel title="Result" variant="raised" style={{ flex: "none" }}>
          <div style={{ padding: "18px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <Icon name={R === "valid" ? "shield-check" : R === "invalid" || R === "error" ? "shield-x" : "shield"} size={22}
              style={{ color: R === "valid" ? "var(--ok)" : R === "invalid" || R === "error" ? "var(--danger)" : "var(--text-tertiary)" }} />
            {R === "valid" ? <Badge kind="ok" dot>Signature valid</Badge>
              : R === "invalid" ? <Badge kind="danger" dot>Invalid signature</Badge>
              : R === "error" ? <span style={{ fontSize: 13, color: "var(--danger)", fontFamily: "var(--font-mono)" }}>{result.message}</span>
              : R === "working" ? <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>verifying…</span>
              : <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Fill in data, signature and public key, then verify.</span>}
          </div>
        </Panel>
      </div>
    </div>
  );
}

export default function CertificateInspectorScreen() {
  const [mode, setMode] = React.useState("Inspect certificate");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <Disclaimer />
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <SegmentedControl options={["Inspect certificate", "Verify signature"]} value={mode} onChange={setMode} />
      </div>
      {mode === "Inspect certificate" ? <InspectView /> : <VerifyView />}
    </div>
  );
}
