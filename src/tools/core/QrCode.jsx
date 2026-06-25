import React from "react";
import { Panel } from "../../../Pocket Design System/components/surfaces/Panel.jsx";
import { Textarea } from "../../../Pocket Design System/components/forms/Textarea.jsx";
import { IconButton } from "../../../Pocket Design System/components/core/IconButton.jsx";
import { Button } from "../../../Pocket Design System/components/core/Button.jsx";
import QRCode from "qrcode";

export default function QrCodeScreen() {
  const [input, setInput] = React.useState("https://usepocket.vercel.app/");
  const [qrDataUrl, setQrDataUrl] = React.useState("");

  React.useEffect(() => {
    if (!input.trim()) {
      setQrDataUrl("");
      return;
    }
    QRCode.toDataURL(input.trim(), { width: 300, margin: 2 }, (err, url) => {
      if (!err) setQrDataUrl(url);
    });
  }, [input]);

  const downloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = "qrcode.png";
    a.click();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Panel title="Input Text or URL" variant="sunken"
          actions={<IconButton icon="x" label="Clear" size="sm" onClick={() => setInput("")} />}>
          <Textarea bare value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Type text or URL here to generate QR code..." style={{ flex: 1, padding: "12px 14px", minHeight: 0 }} />
        </Panel>

        <Panel title="QR Code Preview" variant="raised"
          actions={<Button size="sm" icon="download" onClick={downloadQr} disabled={!qrDataUrl}>Download</Button>}>
          <div style={{ display: "grid", placeItems: "center", flex: 1, padding: 24, background: "var(--code-bg)" }}>
            {qrDataUrl ? (
              <div style={{ padding: 16, background: "#fff", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-1)" }}>
                <img src={qrDataUrl} alt="QR Code" style={{ display: "block", width: 200, height: 200 }} />
              </div>
            ) : (
              <div style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", fontSize: 13 }}>Type something to generate a QR Code</div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
