import React from "react";
import { Panel } from "../../../Pocket Design System/components/surfaces/Panel.jsx";
import { CopyButton } from "../../../Pocket Design System/components/core/CopyButton.jsx";
import { IconButton } from "../../../Pocket Design System/components/core/IconButton.jsx";
import { Button } from "../../../Pocket Design System/components/core/Button.jsx";
import { Input } from "../../../Pocket Design System/components/forms/Input.jsx";

export default function TimestampConverterScreen() {
  const [input, setInput] = React.useState(() => Math.floor(Date.now() / 1000).toString());

  const results = React.useMemo(() => {
    if (!input.trim()) return null;
    let date = null;
    let isTimestamp = false;
    let format = "";

    if (/^\d+$/.test(input.trim())) {
      const num = Number(input.trim());
      isTimestamp = true;
      if (num > 30000000000) {
        date = new Date(num);
        format = "Milliseconds";
      } else {
        date = new Date(num * 1000);
        format = "Seconds";
      }
    } else {
      const ms = Date.parse(input.trim());
      if (!isNaN(ms)) {
        date = new Date(ms);
        format = "Date String";
      }
    }

    if (!date || isNaN(date.getTime())) {
      return { error: "Invalid date format or timestamp" };
    }

    const sec = Math.floor(date.getTime() / 1000);
    const ms = date.getTime();

    const diff = ms - Date.now();
    const absDiff = Math.abs(diff);
    const mins = Math.floor(absDiff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    let relative = "just now";
    if (mins > 0) {
      if (days > 0) relative = days === 1 ? "1 day" : `${days} days`;
      else if (hours > 0) relative = hours === 1 ? "1 hour" : `${hours} hours`;
      else relative = mins === 1 ? "1 minute" : `${mins} minutes`;
      relative = diff > 0 ? `in ${relative}` : `${relative} ago`;
    }

    return {
      sec: sec.toString(),
      ms: ms.toString(),
      iso: date.toISOString(),
      local: date.toString(),
      relative: relative,
      format: format
    };
  }, [input]);

  const loadCurrent = () => {
    setInput(Math.floor(Date.now() / 1000).toString());
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Button variant="secondary" size="sm" icon="clock" onClick={loadCurrent}>Current Time</Button>
        <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
          Automatically detects unix timestamps (s/ms) or human date strings.
        </span>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Panel title="Input Date / Epoch" variant="sunken"
          actions={<IconButton icon="x" label="Clear" size="sm" onClick={() => setInput("")} />}>
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
            <Input mono value={input} onChange={e => setInput(e.target.value)} placeholder="Epoch timestamp or date string..." style={{ height: 42, fontSize: 16 }} />
            {results && !results.error && (
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Detected format: <strong>{results.format}</strong>
              </span>
            )}
          </div>
        </Panel>

        <Panel title="Conversions" variant="code">
          {results?.error ? (
            <div style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: 13, color: "#E08A76" }}>{results.error}</div>
          ) : results ? (
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", flex: 1 }}>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--syn-comment)", letterSpacing: "var(--tracking-caps)" }}>Unix Timestamp (seconds)</span>
                  <CopyButton onDark size="sm" getText={() => results.sec} />
                </div>
                <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--code-fg)", background: "rgba(0,0,0,0.2)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>{results.sec}</code>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--syn-comment)", letterSpacing: "var(--tracking-caps)" }}>Unix Timestamp (milliseconds)</span>
                  <CopyButton onDark size="sm" getText={() => results.ms} />
                </div>
                <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--code-fg)", background: "rgba(0,0,0,0.2)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>{results.ms}</code>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--syn-comment)", letterSpacing: "var(--tracking-caps)" }}>ISO 8601 (UTC)</span>
                  <CopyButton onDark size="sm" getText={() => results.iso} />
                </div>
                <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--code-fg)", background: "rgba(0,0,0,0.2)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>{results.iso}</code>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--syn-comment)", letterSpacing: "var(--tracking-caps)" }}>Local Time</span>
                  <CopyButton onDark size="sm" getText={() => results.local} />
                </div>
                <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--code-fg)", background: "rgba(0,0,0,0.2)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>{results.local}</code>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--syn-comment)", letterSpacing: "var(--tracking-caps)" }}>Relative Time</span>
                <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--code-fg)", background: "rgba(0,0,0,0.2)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>{results.relative}</code>
              </div>

            </div>
          ) : (
            <div style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-tertiary)" }}>Type a valid input to see conversion results.</div>
          )}
        </Panel>
      </div>
    </div>
  );
}
