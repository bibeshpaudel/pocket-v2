// Pocket — DNS Lookup. Resolves records over Google's DNS-over-HTTPS JSON API
// (dns.google/resolve) — CORS-enabled, key-less, HTTPS. A network tool by
// nature: the query leaves the browser (see CLAUDE.md caveats). DS + tokens only.
import React from "react";
import { Panel } from "../../Pocket Design System/components/surfaces/Panel.jsx";
import { Input } from "../../Pocket Design System/components/forms/Input.jsx";
import { Select } from "../../Pocket Design System/components/forms/Select.jsx";
import { Button } from "../../Pocket Design System/components/core/Button.jsx";
import { Badge } from "../../Pocket Design System/components/core/Badge.jsx";
import { CopyButton } from "../../Pocket Design System/components/core/CopyButton.jsx";
import { EmptyState } from "../../Pocket Design System/components/surfaces/EmptyState.jsx";

// numeric RR type -> name (the JSON API returns numbers in Answer[].type)
const TYPE_NAME = { 1: "A", 2: "NS", 5: "CNAME", 6: "SOA", 12: "PTR", 15: "MX", 16: "TXT", 28: "AAAA", 33: "SRV", 257: "CAA" };
const SINGLE_TYPES = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SOA", "CAA", "SRV", "PTR"];
const ALL_TYPES = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SOA", "CAA"];
const DOMAIN_RE = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}$/;

const STATUS_TEXT = { 2: "SERVFAIL", 3: "NXDOMAIN (no such name)", 5: "REFUSED" };

function ttl(s) {
  if (s == null) return "";
  if (s >= 3600) return `${Math.round(s / 3600)}h`;
  if (s >= 60) return `${Math.round(s / 60)}m`;
  return `${s}s`;
}

async function resolveOne(name, type) {
  const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`);
  const data = await res.json();
  const answers = (data.Answer || []).filter((a) => TYPE_NAME[a.type] === type);
  return { type, status: data.Status, answers };
}

export default function DnsLookupScreen() {
  const [domain, setDomain] = React.useState("");
  const [type, setType] = React.useState("ALL");
  const [state, setState] = React.useState({ status: "idle" }); // idle | loading | ok | error

  const lookup = React.useCallback(async () => {
    const name = domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!name) { setState({ status: "error", message: "Enter a domain name to resolve." }); return; }
    if (!DOMAIN_RE.test(name)) { setState({ status: "error", message: `“${name}” doesn't look like a valid domain.` }); return; }

    setState({ status: "loading" });
    try {
      const types = type === "ALL" ? ALL_TYPES : [type];
      const groups = await Promise.all(types.map((t) => resolveOne(name, t)));
      const firstBad = groups.find((g) => g.status !== 0 && g.status !== 3);
      if (type !== "ALL" && groups[0].status === 3) {
        setState({ status: "error", message: `${STATUS_TEXT[3]} for ${name}.` });
        return;
      }
      if (firstBad) {
        setState({ status: "error", message: `Resolver returned ${STATUS_TEXT[firstBad.status] || "status " + firstBad.status}.` });
        return;
      }
      setState({ status: "ok", name, groups: groups.filter((g) => g.answers.length) });
    } catch (e) {
      setState({ status: "error", message: "Network request failed — check your connection." });
    }
  }, [domain, type]);

  const groups = state.status === "ok" ? state.groups : [];
  const total = groups.reduce((n, g) => n + g.answers.length, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <Input mono placeholder="example.com" value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") lookup(); }} />
        </div>
        <Select value={type} onChange={(e) => setType(e.target.value)}
          options={[{ value: "ALL", label: "All common" }, ...SINGLE_TYPES.map((t) => ({ value: t, label: t }))]} />
        <Button variant="primary" icon="search" onClick={lookup} disabled={state.status === "loading"}>
          {state.status === "loading" ? "Resolving…" : "Look up"}
        </Button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {state.status === "idle" ? (
          <EmptyState icon="server" title="Resolve DNS records" hint="Enter a domain and pick a record type. Answers come from Google DNS (dns.google) over HTTPS." />
        ) : state.status === "error" ? (
          <EmptyState icon="triangle-alert" title="Couldn't resolve that" hint={state.message} />
        ) : state.status === "loading" ? (
          <EmptyState icon="loader" title="Resolving…" hint="Querying Google DNS over HTTPS." />
        ) : total === 0 ? (
          <EmptyState icon="circle-off" title="No records found" hint={`${state.name} has no ${type === "ALL" ? "common" : type} records.`} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {groups.map((g) => (
              <Panel key={g.type} variant="raised"
                title={g.type + " — " + g.answers.length + " record" + (g.answers.length === 1 ? "" : "s")}
                actions={<CopyButton label="Copy" getText={() => g.answers.map((a) => a.data).join("\n")} />}>
                <div style={{ padding: "2px 16px 10px" }}>
                  {g.answers.map((a, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderTop: "1px solid var(--border-subtle)" }}>
                      <span style={{ flex: 1, fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-primary)", wordBreak: "break-all" }}>{a.data}</span>
                      {a.TTL != null ? <Badge kind="neutral">TTL {ttl(a.TTL)}</Badge> : null}
                    </div>
                  ))}
                </div>
              </Panel>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
