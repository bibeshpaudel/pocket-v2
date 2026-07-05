// Pocket — Environment Inspector. A client-side diagnostics dashboard: system,
// browser, network, security context, storage, API capabilities, GPU,
// permissions and media devices — all read locally from browser APIs, with
// every heuristic value explicitly badged "estimated" and every missing API
// badged "n/a". The only network feature (public IP / ISP / proxy flag) is
// opt-in behind a button and clearly marked. Composes DS primitives only.
import React from "react";
import { Panel } from "../../Pocket Design System/components/surfaces/Panel.jsx";
import { Button } from "../../Pocket Design System/components/core/Button.jsx";
import { IconButton } from "../../Pocket Design System/components/core/IconButton.jsx";
import { Badge } from "../../Pocket Design System/components/core/Badge.jsx";
import { CopyButton } from "../../Pocket Design System/components/core/CopyButton.jsx";
import { Icon } from "../../Pocket Design System/components/core/Icon.jsx";
import {
  collectSystem, collectBrowser, collectNetwork, collectSecurity,
  collectGraphics, collectCapabilities, collectStorage, estimatePrivateMode,
  collectPermissions, collectDevices, fetchNetworkIntel,
} from "./env-inspect.js";

const SECTIONS = [
  { id: "system", title: "System", icon: "monitor" },
  { id: "browser", title: "Browser", icon: "globe" },
  { id: "network", title: "Network", icon: "wifi", live: true },
  { id: "security", title: "Security & Context", icon: "shield" },
  { id: "graphics", title: "Graphics & GPU", icon: "cpu" },
  { id: "storage", title: "Storage", icon: "database" },
  { id: "privacy", title: "Privacy Mode", icon: "eye-off" },
  { id: "permissions", title: "Permissions", icon: "key-round" },
  { id: "devices", title: "Media Devices", icon: "video" },
  { id: "capabilities", title: "API Capabilities", icon: "layers" },
];

function StatusBadge({ status }) {
  if (status === "estimated") return <Badge kind="warn">estimated</Badge>;
  if (status === "unavailable") return <Badge kind="neutral">n/a</Badge>;
  if (status === "restricted") return <Badge kind="danger">restricted</Badge>;
  return null;
}

function Row({ item }) {
  const missing = item.value == null || item.value === "";
  return (
    <div style={{ display: "flex", gap: 12, padding: "8px 0", borderTop: "1px solid var(--border-subtle)", alignItems: "baseline" }}>
      <span style={{ fontSize: 12, color: "var(--text-tertiary)", width: 130, flex: "none" }}>{item.label}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 13, wordBreak: "break-word",
            color: missing ? "var(--text-tertiary)" : "var(--text-primary)",
            fontStyle: missing ? "italic" : "normal",
            fontFamily: item.mono && !missing ? "var(--font-mono)" : "var(--font-sans)",
          }}>
            {missing ? "Not available" : String(item.value)}
          </span>
          <StatusBadge status={missing && item.status === "ok" ? "unavailable" : item.status} />
        </span>
        {item.note ? (
          <span style={{ display: "block", marginTop: 3, fontSize: 11, lineHeight: 1.45, color: "var(--text-tertiary)" }}>{item.note}</span>
        ) : null}
      </span>
    </div>
  );
}

// Capabilities render as a compact two-column checklist instead of label/value rows.
function CapabilityGrid({ rows }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
      {rows.map((c) => (
        <span key={c.label} style={{
          display: "flex", alignItems: "center", gap: 7, padding: "6px 10px",
          background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)", fontSize: 12,
          color: c.supported ? "var(--text-primary)" : "var(--text-tertiary)",
        }}>
          <Icon name={c.supported ? "check" : "x"} size={12}
            style={{ color: c.supported ? "var(--amber-600)" : "var(--text-tertiary)", flex: "none" }} />
          {c.label}
        </span>
      ))}
    </div>
  );
}

function Section({ section, rows, collapsed, onToggle }) {
  const loading = rows == null;
  return (
    <Panel variant="raised"
      title={section.title}
      meta={section.live ? <Badge kind="accent" dot>live</Badge> : loading ? "…" : rows.length + (rows.length === 1 ? " item" : " items")}
      actions={<IconButton size="sm" icon={collapsed ? "chevron-down" : "chevron-up"}
        label={collapsed ? "Expand " + section.title : "Collapse " + section.title}
        onClick={onToggle} />}>
      {collapsed ? null : (
        <div style={{ padding: "2px 16px 12px" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0", fontSize: 12, color: "var(--text-tertiary)" }}>
              <Icon name="loader" size={13} /> Collecting…
            </div>
          ) : section.id === "capabilities" ? (
            <div style={{ paddingTop: 10 }}><CapabilityGrid rows={rows} /></div>
          ) : (
            rows.map((item, i) => <Row key={item.label + i} item={item} />)
          )}
        </div>
      )}
    </Panel>
  );
}

// The one opt-in network section — nothing is fetched until the user clicks.
function IntelSection({ intel, onFetch, collapsed, onToggle }) {
  return (
    <Panel variant="raised" title="Public IP & VPN"
      meta={<Badge kind="warn" dot>network</Badge>}
      actions={<IconButton size="sm" icon={collapsed ? "chevron-down" : "chevron-up"}
        label={collapsed ? "Expand Public IP & VPN" : "Collapse Public IP & VPN"} onClick={onToggle} />}>
      {collapsed ? null : (
        <div style={{ padding: "2px 16px 12px" }}>
          {intel.status === "ok" ? (
            intel.rows.map((item, i) => <Row key={item.label + i} item={item} />)
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "10px 0 4px" }}>
              <span style={{ fontSize: 12, lineHeight: 1.5, color: "var(--text-secondary)" }}>
                Optional lookup of your public IP, ISP and a proxy/VPN flag. Unlike everything
                above, this sends one request to freeipapi.com (fallback: ipapi.co) — nothing
                is fetched until you ask.
              </span>
              {intel.status === "error" ? (
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}>
                  <Icon name="triangle-alert" size={13} style={{ color: "var(--text-tertiary)" }} /> {intel.message}
                </span>
              ) : null}
              <span>
                <Button variant="secondary" size="sm" icon="map-pin" onClick={onFetch} disabled={intel.status === "loading"}>
                  {intel.status === "loading" ? "Fetching…" : "Fetch public IP details"}
                </Button>
              </span>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

export default function EnvInspectorScreen() {
  const [data, setData] = React.useState({});
  const [intel, setIntel] = React.useState({ status: "idle" });
  const [collapsed, setCollapsed] = React.useState({});
  const [updatedAt, setUpdatedAt] = React.useState(null);
  const [online, setOnline] = React.useState(() => navigator.onLine);

  const refresh = React.useCallback(() => {
    // Sync collectors land immediately; async ones fill in as they resolve.
    setData({
      system: collectSystem(),
      browser: collectBrowser(),
      network: collectNetwork(),
      security: collectSecurity(),
      graphics: collectGraphics(),
      capabilities: collectCapabilities(),
      storage: null, privacy: null, permissions: null, devices: null,
    });
    setUpdatedAt(new Date());
    const fill = (id) => (rows) => setData((d) => ({ ...d, [id]: rows }));
    const fail = (id, msg) => () => fill(id)([{ label: msg, value: null, status: "unavailable", note: null, mono: false }]);
    collectStorage().then(fill("storage"), fail("storage", "Storage checks failed"));
    estimatePrivateMode().then(fill("privacy"), fail("privacy", "Private-mode heuristic failed"));
    collectPermissions().then(fill("permissions"), fail("permissions", "Permission queries failed"));
    collectDevices().then(fill("devices"), fail("devices", "Device enumeration failed"));
  }, []);

  React.useEffect(() => { refresh(); }, [refresh]);

  // Live updates: online/offline + Network Information API change events.
  React.useEffect(() => {
    const onChange = () => {
      setOnline(navigator.onLine);
      setData((d) => ({ ...d, network: collectNetwork(), browser: collectBrowser() }));
      setUpdatedAt(new Date());
    };
    window.addEventListener("online", onChange);
    window.addEventListener("offline", onChange);
    const c = navigator.connection;
    if (c && c.addEventListener) c.addEventListener("change", onChange);
    return () => {
      window.removeEventListener("online", onChange);
      window.removeEventListener("offline", onChange);
      if (c && c.removeEventListener) c.removeEventListener("change", onChange);
    };
  }, []);

  const buildReport = React.useCallback(() => {
    const sections = {};
    for (const s of SECTIONS) {
      sections[s.id] = (data[s.id] || []).map(({ label, value, status, note }) => ({
        item: label, value: value == null || value === "" ? null : value, status, ...(note ? { note } : {}),
      }));
    }
    if (intel.status === "ok") {
      sections.publicIp = intel.rows.map(({ label, value, status, note }) => ({
        item: label, value: value == null ? null : value, status, ...(note ? { note } : {}),
      }));
    }
    return JSON.stringify({
      tool: "Pocket — Environment Inspector",
      generatedAt: new Date().toISOString(),
      disclaimer: "Values marked 'estimated' are best-effort heuristics that browsers may bucket, freeze or spoof; 'n/a' means the API is not exposed in this browser; 'restricted' means data is hidden until a permission is granted.",
      sections,
    }, null, 2);
  }, [data, intel]);

  const downloadReport = React.useCallback(() => {
    const blob = new Blob([buildReport()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pocket-environment-report.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [buildReport]);

  const allIds = SECTIONS.map((s) => s.id).concat("intel");
  const allCollapsed = allIds.every((id) => collapsed[id]);
  const setAll = (v) => setCollapsed(Object.fromEntries(allIds.map((id) => [id, v])));
  const toggle = (id) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Badge kind={online ? "ok" : "danger"} dot>{online ? "Online" : "Offline"}</Badge>
        <Button variant="secondary" size="sm" icon="refresh-cw" onClick={refresh}>Refresh</Button>
        <Button variant="ghost" size="sm" icon={allCollapsed ? "chevrons-down" : "chevrons-up"} onClick={() => setAll(!allCollapsed)}>
          {allCollapsed ? "Expand all" : "Collapse all"}
        </Button>
        {updatedAt ? (
          <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
            snapshot {updatedAt.toLocaleTimeString()}
          </span>
        ) : null}
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <CopyButton getText={buildReport} label="Copy JSON" />
          <Button variant="primary" size="sm" icon="download" onClick={downloadReport}>Report</Button>
        </span>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingBottom: 4 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14, alignItems: "start" }}>
          {SECTIONS.map((s) => (
            <Section key={s.id} section={s} rows={data[s.id]}
              collapsed={!!collapsed[s.id]} onToggle={() => toggle(s.id)} />
          ))}
          <IntelSection intel={intel} collapsed={!!collapsed.intel} onToggle={() => toggle("intel")}
            onFetch={async () => {
              setIntel({ status: "loading" });
              try { setIntel({ status: "ok", rows: await fetchNetworkIntel() }); }
              catch (e) { setIntel({ status: "error", message: (e && e.message) || "Lookup failed." }); }
            }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 12, fontSize: 11, color: "var(--text-tertiary)" }}>
          <Icon name="info" size={12} style={{ flex: "none" }} />
          Everything on this page is read locally from browser APIs — nothing leaves your browser
          unless you use the opt-in “Public IP &amp; VPN” lookup. “estimated” marks heuristics the
          browser may bucket, freeze or spoof.
        </div>
      </div>
    </div>
  );
}
