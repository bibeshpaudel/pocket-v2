// Pocket — AES Encrypt / Decrypt. Fully client-side via Web Crypto (SubtleCrypto).
// Types: AES-GCM / AES-CBC / AES-CTR, 128/192/256-bit, key from passphrase (PBKDF2-SHA256)
// or a raw hex/base64 key. Encrypt emits a self-describing Base64 bundle (version, mode,
// key size, KDF, iterations, salt, IV, ciphertext) so decrypt only needs the bundle + secret.
import React from "react";
import { Panel } from "../../Pocket Design System/components/surfaces/Panel.jsx";
import { Textarea } from "../../Pocket Design System/components/forms/Textarea.jsx";
import { Input } from "../../Pocket Design System/components/forms/Input.jsx";
import { Badge } from "../../Pocket Design System/components/core/Badge.jsx";
import { Button } from "../../Pocket Design System/components/core/Button.jsx";
import { IconButton } from "../../Pocket Design System/components/core/IconButton.jsx";
import { CopyButton } from "../../Pocket Design System/components/core/CopyButton.jsx";
import { Select } from "../../Pocket Design System/components/forms/Select.jsx";
import { SegmentedControl } from "../../Pocket Design System/components/forms/SegmentedControl.jsx";

const MODE_ID = { GCM: 1, CBC: 2, CTR: 3 };
const ID_MODE = { 1: "GCM", 2: "CBC", 3: "CTR" };
const ALGO = { GCM: "AES-GCM", CBC: "AES-CBC", CTR: "AES-CTR" };

const enc = new TextEncoder();
const dec = new TextDecoder();

function concat(arrs) {
  let len = 0; for (const a of arrs) len += a.length;
  const out = new Uint8Array(len); let o = 0;
  for (const a of arrs) { out.set(a, o); o += a.length; }
  return out;
}
function bytesToB64(bytes) {
  let bin = ""; const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  return btoa(bin);
}
function b64ToBytes(b64) {
  const bin = atob(b64.trim());
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function hexToBytes(hex) {
  const s = hex.replace(/\s+/g, "");
  if (s.length % 2) throw new Error("Hex key has an odd length.");
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i++) {
    const b = parseInt(s.substr(i * 2, 2), 16);
    if (Number.isNaN(b)) throw new Error("Raw key is not valid hex/base64.");
    out[i] = b;
  }
  return out;
}
function parseRawKey(str) {
  const s = str.trim();
  const noWs = s.replace(/\s+/g, "");
  if (/^[0-9a-fA-F]+$/.test(noWs) && noWs.length % 2 === 0) return hexToBytes(noWs);
  return b64ToBytes(s);
}

function ivParams(mode, iv) {
  if (mode === "GCM") return { name: "AES-GCM", iv };
  if (mode === "CBC") return { name: "AES-CBC", iv };
  return { name: "AES-CTR", counter: iv, length: 64 };
}

async function getKey({ keyType, secret, keyBytes, mode, salt, iterations }) {
  if (keyType === "Raw key") {
    const raw = parseRawKey(secret);
    if (raw.length !== keyBytes) throw new Error(`Raw key must be ${keyBytes} bytes (${keyBytes * 8}-bit); got ${raw.length}.`);
    return crypto.subtle.importKey("raw", raw, { name: ALGO[mode] }, false, ["encrypt", "decrypt"]);
  }
  const base = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "PBKDF2" }, false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    base, { name: ALGO[mode], length: keyBytes * 8 }, false, ["encrypt", "decrypt"]
  );
}

async function aesEncrypt({ plaintext, mode, keyBytes, keyType, secret, iterations }) {
  const usesKdf = keyType === "Passphrase";
  const salt = usesKdf ? crypto.getRandomValues(new Uint8Array(16)) : new Uint8Array(0);
  const key = await getKey({ keyType, secret, keyBytes, mode, salt, iterations });
  const iv = crypto.getRandomValues(new Uint8Array(mode === "GCM" ? 12 : 16));
  const ct = new Uint8Array(await crypto.subtle.encrypt(ivParams(mode, iv), key, enc.encode(plaintext)));

  const head = new Uint8Array([
    1, MODE_ID[mode], keyBytes, usesKdf ? 1 : 0,
    (iterations >>> 24) & 255, (iterations >>> 16) & 255, (iterations >>> 8) & 255, iterations & 255,
    salt.length,
  ]);
  return bytesToB64(concat([head, salt, new Uint8Array([iv.length]), iv, ct]));
}

async function aesDecrypt({ bundleB64, secret }) {
  let b;
  try { b = b64ToBytes(bundleB64); } catch (e) { throw new Error("Input is not valid Base64."); }
  let o = 0;
  if (b[o++] !== 1) throw new Error("Unrecognized bundle (wrong format or not produced here).");
  const mode = ID_MODE[b[o++]];
  if (!mode) throw new Error("Unknown cipher mode in bundle.");
  const keyBytes = b[o++];
  const kdf = b[o++];
  const iterations = ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0; o += 4;
  const saltLen = b[o++]; const salt = b.slice(o, o + saltLen); o += saltLen;
  const ivLen = b[o++]; const iv = b.slice(o, o + ivLen); o += ivLen;
  const ct = b.slice(o);

  const key = await getKey({ keyType: kdf === 1 ? "Passphrase" : "Raw key", secret, keyBytes, mode, salt, iterations });
  const pt = await crypto.subtle.decrypt(ivParams(mode, iv), key, ct);
  return { text: dec.decode(pt), mode, keyBytes };
}

function friendlyError(e) {
  const msg = String((e && e.message) || e);
  if (e && (e.name === "OperationError" || /operation/i.test(msg))) {
    return "Decryption failed — wrong key/passphrase, wrong mode, or the ciphertext was modified.";
  }
  return msg;
}

const SAMPLE = "The quick brown fox jumps over the lazy dog.";

export default function AesToolScreen() {
  const [direction, setDirection] = React.useState("Encrypt");
  const [mode, setMode] = React.useState("GCM");
  const [keyBits, setKeyBits] = React.useState("256");
  const [keyType, setKeyType] = React.useState("Passphrase");
  const [iterations, setIterations] = React.useState("250000");
  const [secret, setSecret] = React.useState("correct horse battery staple");
  const [reveal, setReveal] = React.useState(false);
  const [input, setInput] = React.useState(SAMPLE);
  const [result, setResult] = React.useState({ output: "", status: null });
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    if (!input.trim() || !secret) { setResult({ output: "", status: null }); return undefined; }
    setBusy(true);
    const handler = setTimeout(async () => {
      try {
        if (direction === "Encrypt") {
          const out = await aesEncrypt({ plaintext: input, mode, keyBytes: Number(keyBits) / 8, keyType, secret, iterations: Number(iterations) });
          if (!cancelled) setResult({ output: out, status: "enc" });
        } else {
          const { text } = await aesDecrypt({ bundleB64: input, secret });
          if (!cancelled) setResult({ output: text, status: "dec" });
        }
      } catch (e) {
        if (!cancelled) setResult({ output: "", status: "err", error: friendlyError(e) });
      } finally {
        if (!cancelled) setBusy(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(handler); setBusy(false); };
  }, [input, secret, direction, mode, keyBits, keyType, iterations]);

  const generateKey = () => {
    const bytes = crypto.getRandomValues(new Uint8Array(Number(keyBits) / 8));
    setSecret(bytesToB64(bytes));
    setReveal(true);
  };

  const isEncrypt = direction === "Encrypt";
  const outMeta = result.status === "err" ? <Badge kind="danger">Failed</Badge>
    : result.status === "enc" ? <Badge kind="ok" dot>Encrypted</Badge>
    : result.status === "dec" ? <Badge kind="ok" dot>Decrypted</Badge>
    : busy ? <span style={{ color: "var(--text-tertiary)" }}>working…</span> : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <SegmentedControl options={["Encrypt", "Decrypt"]} value={direction} onChange={setDirection} />
        <Select options={[{ value: "GCM", label: "AES-GCM (authenticated)" }, { value: "CBC", label: "AES-CBC" }, { value: "CTR", label: "AES-CTR" }]}
          value={mode} onChange={(e) => setMode(e.target.value)} disabled={!isEncrypt} />
        <SegmentedControl options={["Passphrase", "Raw key"]} value={keyType} onChange={setKeyType} />
        {isEncrypt ? (
          <>
            <SegmentedControl options={["128", "192", "256"]} value={keyBits} onChange={setKeyBits} />
            {keyType === "Passphrase" ? (
              <Select options={[{ value: "100000", label: "100k iters" }, { value: "250000", label: "250k iters" }, { value: "600000", label: "600k iters" }]}
                value={iterations} onChange={(e) => setIterations(e.target.value)} />
            ) : null}
          </>
        ) : (
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Mode, key size & salt are read from the bundle.</span>
        )}
        <span style={{ marginLeft: "auto" }}>
          <Button variant="ghost" size="sm" icon="rotate-ccw" onClick={() => setInput(isEncrypt ? SAMPLE : input)}>Sample</Button>
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Input mono type={reveal ? "text" : "password"} value={secret} onChange={(e) => setSecret(e.target.value)}
          placeholder={keyType === "Passphrase" ? "Passphrase…" : "Raw key — hex or base64"} style={{ flex: 1 }} />
        <IconButton icon={reveal ? "eye-off" : "eye"} label="Show or hide secret" onClick={() => setReveal((r) => !r)} />
        {keyType === "Raw key" ? <Button variant="secondary" size="sm" icon="dices" onClick={generateKey}>Generate</Button> : null}
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Panel title={isEncrypt ? "Plaintext" : "Encrypted bundle"} variant="sunken" meta={input.length.toLocaleString() + " chars"}
          actions={<IconButton icon="x" label="Clear" size="sm" onClick={() => setInput("")} />}>
          <Textarea bare value={input} onChange={(e) => setInput(e.target.value)}
            placeholder={isEncrypt ? "Type the text to encrypt…" : "Paste the encrypted bundle (Base64)…"}
            style={{ flex: 1, padding: "12px 14px", minHeight: 0 }} />
        </Panel>

        <Panel title={isEncrypt ? "Encrypted bundle" : "Plaintext"} variant="code" meta={outMeta}
          actions={result.output ? <CopyButton onDark getText={() => result.output} /> : null}>
          {result.status === "err" ? (
            <div style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.6, color: "#E08A76" }}>{result.error}</div>
          ) : (
            <pre style={{ margin: 0, padding: "12px 16px", overflow: "auto", flex: 1, fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.6, color: "var(--code-fg)", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
              {result.output || (busy ? "" : (isEncrypt ? "Encrypted output appears here." : "Decrypted text appears here."))}
            </pre>
          )}
        </Panel>
      </div>
    </div>
  );
}
