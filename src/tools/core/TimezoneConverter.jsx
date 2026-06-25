import React from "react";
import { Panel } from "../../../Pocket Design System/components/surfaces/Panel.jsx";
import { CopyButton } from "../../../Pocket Design System/components/core/CopyButton.jsx";
import { Button } from "../../../Pocket Design System/components/core/Button.jsx";
import { Select } from "../../../Pocket Design System/components/forms/Select.jsx";

const TIMEZONES = [
  { id: "UTC", name: "Coordinated Universal Time (UTC)" },
  { id: "America/New_York", name: "New York (EST/EDT)" },
  { id: "Europe/London", name: "London (GMT/BST)" },
  { id: "Europe/Paris", name: "Paris (CET/CEST)" },
  { id: "Asia/Tokyo", name: "Tokyo (JST)" },
  { id: "Australia/Sydney", name: "Sydney (AEST/AEDT)" }
];

export default function TimezoneConverterScreen() {
  const [baseDate, setBaseDate] = React.useState(() => {
    const now = new Date();
    const pad = n => n.toString().padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  });
  const [sourceZone, setSourceZone] = React.useState("UTC");

  const results = React.useMemo(() => {
    if (!baseDate) return [];

    let date = new Date(baseDate);
    if (isNaN(date.getTime())) return [];

    if (sourceZone !== "UTC") {
      try {
        const utcStr = date.toLocaleString("en-US", { timeZone: "UTC" });
        const srcStr = date.toLocaleString("en-US", { timeZone: sourceZone });
        const diffMs = Date.parse(utcStr) - Date.parse(srcStr);
        date = new Date(date.getTime() + diffMs);
      } catch (e) {
        console.error(e);
      }
    } else {
      const parts = baseDate.split(/[-T:]/);
      if (parts.length >= 5) {
        date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], parts[3], parts[4]));
      }
    }

    if (isNaN(date.getTime())) return [];

    return TIMEZONES.map(tz => {
      try {
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: tz.id,
          year: "numeric", month: "short", day: "2-digit",
          hour: "2-digit", minute: "2-digit", second: "2-digit",
          hour12: false
        });
        const formatted = formatter.format(date);
        return {
          id: tz.id,
          name: tz.name,
          time: formatted
        };
      } catch (e) {
        return {
          id: tz.id,
          name: tz.name,
          time: "Unsupported timezone"
        };
      }
    });
  }, [baseDate, sourceZone]);

  const loadCurrent = () => {
    const now = new Date();
    const pad = n => n.toString().padStart(2, "0");
    setBaseDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Button variant="secondary" size="sm" icon="clock" onClick={loadCurrent}>Current Time</Button>
        <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Source Zone</span>
        <Select options={TIMEZONES.map(tz => ({ value: tz.id, label: tz.name }))} value={sourceZone} onChange={e => setSourceZone(e.target.value)} />
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Panel title="Source DateTime" variant="sunken">
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>Enter source date and time:</span>
            <input type="datetime-local" value={baseDate} onChange={e => setBaseDate(e.target.value)}
              style={{
                height: 42, padding: "0 14px", fontFamily: "var(--font-mono)", fontSize: 16,
                color: "var(--text-primary)", background: "var(--surface-sunken)",
                border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)",
                outline: "none", width: "100%", maxWidth: 320
              }} />
          </div>
        </Panel>

        <Panel title="Comparisons" variant="code">
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", flex: 1 }}>
            {results.map(res => (
              <div key={res.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--syn-comment)", letterSpacing: "var(--tracking-caps)" }}>{res.name}</span>
                  <CopyButton onDark size="sm" getText={() => res.time} />
                </div>
                <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--code-fg)", background: "rgba(0,0,0,0.2)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>{res.time}</code>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
