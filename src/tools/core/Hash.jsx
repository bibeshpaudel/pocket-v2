import React from "react";
import { Panel } from "../../../Pocket Design System/components/surfaces/Panel.jsx";
import { Textarea } from "../../../Pocket Design System/components/forms/Textarea.jsx";
import { CopyButton } from "../../../Pocket Design System/components/core/CopyButton.jsx";
import { IconButton } from "../../../Pocket Design System/components/core/IconButton.jsx";
import { useSplitView } from "../../split-view.jsx";
import md5 from "blueimp-md5";
import { sha3, blake2b, blake3 } from "hash-wasm";

export default function HashScreen() {
  const [input, setInput] = React.useState("pocket");
  const sv = useSplitView("Input", "Hashes");
  const [hashes, setHashes] = React.useState({
    md5: "",
    sha1: "",
    sha256: "",
    sha512: "",
    sha3: "",
    blake2: "",
    blake3: ""
  });

  React.useEffect(() => {
    if (!input) {
      setHashes({
        md5: "",
        sha1: "",
        sha256: "",
        sha512: "",
        sha3: "",
        blake2: "",
        blake3: ""
      });
      return;
    }

    const handler = setTimeout(async () => {
      let md5Val = "";
      try {
        md5Val = md5(input);
      } catch (e) {
        console.error(e);
      }

      let sha1Val = "";
      let sha256Val = "";
      let sha512Val = "";
      try {
        const msgUint8 = new TextEncoder().encode(input);

        const sha1Buffer = await crypto.subtle.digest("SHA-1", msgUint8);
        const sha1Array = Array.from(new Uint8Array(sha1Buffer));
        sha1Val = sha1Array.map(b => b.toString(16).padStart(2, "0")).join("");

        const sha256Buffer = await crypto.subtle.digest("SHA-256", msgUint8);
        const sha256Array = Array.from(new Uint8Array(sha256Buffer));
        sha256Val = sha256Array.map(b => b.toString(16).padStart(2, "0")).join("");

        const sha512Buffer = await crypto.subtle.digest("SHA-512", msgUint8);
        const sha512Array = Array.from(new Uint8Array(sha512Buffer));
        sha512Val = sha512Array.map(b => b.toString(16).padStart(2, "0")).join("");
      } catch (e) {
        console.error(e);
      }

      let sha3Val = "";
      let blake2Val = "";
      let blake3Val = "";
      try {
        sha3Val = await sha3(input);
        blake2Val = await blake2b(input);
        blake3Val = await blake3(input);
      } catch (e) {
        console.error(e);
      }

      setHashes({
        md5: md5Val,
        sha1: sha1Val,
        sha256: sha256Val,
        sha512: sha512Val,
        sha3: sha3Val,
        blake2: blake2Val,
        blake3: blake3Val
      });
    }, 150);

    return () => clearTimeout(handler);
  }, [input]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {sv.control}
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: sv.columns, gap: 14 }}>
        <Panel style={sv.leftStyle} title="Input" variant="sunken" meta={input.length.toLocaleString() + " chars"}
          actions={<IconButton icon="x" label="Clear" size="sm" onClick={() => setInput("")} />}>
          <Textarea bare value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Type text to hash..." style={{ flex: 1, padding: "12px 14px", minHeight: 0 }} />
        </Panel>

        <Panel style={sv.rightStyle} title="Hashes" variant="code">
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", flex: 1 }}>

            {/* MD5 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--syn-comment)", letterSpacing: "var(--tracking-caps)" }}>MD5</span>
                {hashes.md5 && <CopyButton onDark size="sm" getText={() => hashes.md5} />}
              </div>
              <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: hashes.md5 ? "var(--code-fg)" : "var(--text-tertiary)", wordBreak: "break-all", background: "rgba(0,0,0,0.2)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>
                {hashes.md5 || "—"}
              </code>
            </div>

            {/* SHA-1 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--syn-comment)", letterSpacing: "var(--tracking-caps)" }}>SHA-1</span>
                {hashes.sha1 && <CopyButton onDark size="sm" getText={() => hashes.sha1} />}
              </div>
              <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: hashes.sha1 ? "var(--code-fg)" : "var(--text-tertiary)", wordBreak: "break-all", background: "rgba(0,0,0,0.2)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>
                {hashes.sha1 || "—"}
              </code>
            </div>

            {/* SHA-256 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--syn-comment)", letterSpacing: "var(--tracking-caps)" }}>SHA-256</span>
                {hashes.sha256 && <CopyButton onDark size="sm" getText={() => hashes.sha256} />}
              </div>
              <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: hashes.sha256 ? "var(--code-fg)" : "var(--text-tertiary)", wordBreak: "break-all", background: "rgba(0,0,0,0.2)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>
                {hashes.sha256 || "—"}
              </code>
            </div>

            {/* SHA-512 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--syn-comment)", letterSpacing: "var(--tracking-caps)" }}>SHA-512</span>
                {hashes.sha512 && <CopyButton onDark size="sm" getText={() => hashes.sha512} />}
              </div>
              <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: hashes.sha512 ? "var(--code-fg)" : "var(--text-tertiary)", wordBreak: "break-all", background: "rgba(0,0,0,0.2)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>
                {hashes.sha512 || "—"}
              </code>
            </div>

            {/* SHA-3 (Keccak-512 / Standard) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--syn-comment)", letterSpacing: "var(--tracking-caps)" }}>SHA-3</span>
                {hashes.sha3 && <CopyButton onDark size="sm" getText={() => hashes.sha3} />}
              </div>
              <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: hashes.sha3 ? "var(--code-fg)" : "var(--text-tertiary)", wordBreak: "break-all", background: "rgba(0,0,0,0.2)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>
                {hashes.sha3 || "—"}
              </code>
            </div>

            {/* BLAKE2 (BLAKE2b-512) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--syn-comment)", letterSpacing: "var(--tracking-caps)" }}>BLAKE2</span>
                {hashes.blake2 && <CopyButton onDark size="sm" getText={() => hashes.blake2} />}
              </div>
              <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: hashes.blake2 ? "var(--code-fg)" : "var(--text-tertiary)", wordBreak: "break-all", background: "rgba(0,0,0,0.2)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>
                {hashes.blake2 || "—"}
              </code>
            </div>

            {/* BLAKE3 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--syn-comment)", letterSpacing: "var(--tracking-caps)" }}>BLAKE3</span>
                {hashes.blake3 && <CopyButton onDark size="sm" getText={() => hashes.blake3} />}
              </div>
              <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: hashes.blake3 ? "var(--code-fg)" : "var(--text-tertiary)", wordBreak: "break-all", background: "rgba(0,0,0,0.2)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>
                {hashes.blake3 || "—"}
              </code>
            </div>

          </div>
        </Panel>
      </div>
    </div>
  );
}
