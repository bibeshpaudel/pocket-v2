// Pocket — Cron Expression Explainer. Parses a standard 5-field cron expression,
// describes it in English + a per-field breakdown, and lists the next run times.
// All local; the next-run search is bounded so it can't hang. DS + tokens.
import React from "react";
import { Panel } from "../../Pocket Design System/components/surfaces/Panel.jsx";
import { Input } from "../../Pocket Design System/components/forms/Input.jsx";
import { Badge } from "../../Pocket Design System/components/core/Badge.jsx";
import { Button } from "../../Pocket Design System/components/core/Button.jsx";
import { EmptyState } from "../../Pocket Design System/components/surfaces/EmptyState.jsx";
import { parseCron, describeCron, cronBreakdown, nextRuns } from "./cron-util.js";

const PRESETS = [
  ["Every minute", "* * * * *"],
  ["Every 5 min", "*/5 * * * *"],
  ["Hourly", "0 * * * *"],
  ["Daily 9am", "0 9 * * *"],
  ["Weekdays 8:30", "30 8 * * 1-5"],
  ["1st of month", "0 0 1 * *"],
];

export default function CronExplainerScreen() {
  const [expr, setExpr] = React.useState("*/5 9-17 * * 1-5");

  const result = React.useMemo(() => {
    try {
      const p = parseCron(expr);
      return { p, desc: describeCron(p), rows: cronBreakdown(p), runs: nextRuns(p, new Date(), 6), error: null };
    } catch (e) {
      return { error: (e && e.message) || "Invalid cron expression" };
    }
  }, [expr]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Input mono value={expr} onChange={(e) => setExpr(e.target.value)} placeholder="*/5 * * * *" style={{ width: 260 }} />
        {result.error ? <Badge kind="danger">Invalid</Badge> : <Badge kind="ok" dot>Valid</Badge>}
        <span style={{ marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {PRESETS.map(([label, val]) => (
            <Button key={val} variant="ghost" size="sm" onClick={() => setExpr(val)}>{label}</Button>
          ))}
        </span>
      </div>

      {result.error ? (
        <Panel variant="sunken" style={{ flex: 1, minHeight: 0 }}>
          <EmptyState icon="triangle-alert" title="Couldn’t parse that expression" hint={result.error} style={{ margin: "auto" }} />
        </Panel>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, flex: 1, minHeight: 0 }}>
          <Panel variant="raised" title="Meaning" style={{ minHeight: 0 }}>
            <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.5 }}>{result.desc}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {result.rows.map(([field, val]) => (
                  <div key={field} style={{ display: "flex", gap: 10, padding: "7px 12px", background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" }}>
                    <span style={{ width: 110, fontSize: 12, color: "var(--text-tertiary)" }}>{field}</span>
                    <span style={{ flex: 1, fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-primary)" }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel variant="raised" title="Next runs" meta="local time" style={{ minHeight: 0 }}>
            <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              {result.runs.length ? result.runs.map((d, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" }}>
                  <span style={{ width: 18, fontSize: 12, color: "var(--text-tertiary)" }}>{i + 1}</span>
                  <span style={{ flex: 1, fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-primary)" }}>
                    {d.toLocaleString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              )) : (
                <EmptyState icon="clock" title="No runs within a year" hint="This schedule has no matching time in the next 366 days." style={{ margin: "auto" }} />
              )}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
