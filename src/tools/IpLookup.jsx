// Pocket — IP Lookup. Geolocates an IPv4/IPv6 address (or your own, when left
// blank). Primary provider is ipapi.co; on any failure (notably its daily rate
// limit) it automatically falls back to freeipapi.com. Both are free, key-less,
// HTTPS, CORS-enabled — but this is a network tool by nature: the query leaves
// the browser (see CLAUDE.md caveats). Composes design-system primitives only.
import React from "react";
import { Panel } from "../../Pocket Design System/components/surfaces/Panel.jsx";
import { Input } from "../../Pocket Design System/components/forms/Input.jsx";
import { Button } from "../../Pocket Design System/components/core/Button.jsx";
import { Badge } from "../../Pocket Design System/components/core/Badge.jsx";
import { CopyButton } from "../../Pocket Design System/components/core/CopyButton.jsx";
import { EmptyState } from "../../Pocket Design System/components/surfaces/EmptyState.jsx";
import { Icon } from "../../Pocket Design System/components/core/Icon.jsx";

const IP_RE = /^(\d{1,3}\.){3}\d{1,3}$|^([0-9a-fA-F:]+:+)+[0-9a-fA-F]+$/;

// Both providers are normalized into this shape so the render stays provider-agnostic.
// { ip, version, city, region, country_name, country_code, continent_code,
//   postal, latitude, longitude, timezone (IANA or null), utc_offset, asn, org, source }

function normalizeIpapi(d) {
  return {
    ip: d.ip, version: d.version,
    city: d.city, region: d.region,
    country_name: d.country_name, country_code: d.country_code,
    continent_code: d.continent_code, postal: d.postal,
    latitude: d.latitude, longitude: d.longitude,
    timezone: d.timezone, utc_offset: d.utc_offset,
    asn: d.asn, org: d.org,
    source: "ipapi.co",
  };
}

function normalizeFreeipapi(d) {
  return {
    ip: d.ipAddress, version: d.ipVersion ? "IPv" + d.ipVersion : null,
    city: d.cityName, region: d.regionName,
    country_name: d.countryName, country_code: d.countryCode,
    continent_code: d.continentCode, postal: d.zipCode,
    latitude: d.latitude, longitude: d.longitude,
    timezone: null, utc_offset: d.timeZone, // freeipapi returns a UTC offset, not an IANA zone
    asn: d.asn, org: d.organization || d.org,
    source: "freeipapi.com",
  };
}

async function fetchIpapi(target) {
  const url = target ? `https://ipapi.co/${encodeURIComponent(target)}/json/` : "https://ipapi.co/json/";
  const res = await fetch(url);
  const data = await res.json().catch(() => null);
  if (!res.ok || !data || data.error) {
    throw new Error((data && (data.reason || data.message)) || `ipapi.co returned ${res.status}`);
  }
  return normalizeIpapi(data);
}

// api.ipify.org is an IPv4-only host (no AAAA record), so this always returns the
// public IPv4 even when the browser is otherwise reachable over IPv6.
async function fetchMyIpv4() {
  const res = await fetch("https://api.ipify.org?format=json");
  if (!res.ok) throw new Error("ipify returned " + res.status);
  const data = await res.json();
  if (!data || !data.ip) throw new Error("ipify returned no IP");
  return data.ip;
}

async function fetchFreeipapi(target) {
  const url = target ? `https://freeipapi.com/api/json/${encodeURIComponent(target)}` : "https://freeipapi.com/api/json/";
  const res = await fetch(url);
  if (!res.ok) throw new Error(`freeipapi.com returned ${res.status}`);
  const data = await res.json().catch(() => null);
  if (!data || !data.ipAddress) throw new Error("freeipapi.com returned no usable data");
  return normalizeFreeipapi(data);
}

function Row({ label, value, mono = true }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div style={{ display: "flex", gap: 12, padding: "7px 0", borderTop: "1px solid var(--border-subtle)" }}>
      <span style={{ fontSize: 12, color: "var(--text-tertiary)", width: 120, flex: "none" }}>{label}</span>
      <span style={{ fontSize: 13, color: "var(--text-primary)", fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)", wordBreak: "break-all" }}>{value}</span>
    </div>
  );
}

function Card({ title, children, actions }) {
  return (
    <Panel title={title} variant="raised" actions={actions}>
      <div style={{ padding: "4px 16px 12px" }}>{children}</div>
    </Panel>
  );
}

function localTimeIn(tz) {
  if (!tz) return null;
  try { return new Date().toLocaleString(undefined, { timeZone: tz }); }
  catch (e) { return null; }
}

export default function IpLookupScreen() {
  const [query, setQuery] = React.useState("");
  const [state, setState] = React.useState({ status: "idle" }); // idle | loading | ok | error

  const lookup = React.useCallback(async (ip) => {
    const target = (ip ?? query).trim();
    if (target && !IP_RE.test(target)) {
      setState({ status: "error", message: "That doesn't look like an IPv4 or IPv6 address." });
      return;
    }
    setState({ status: "loading" });
    try {
      let data;
      try {
        data = await fetchIpapi(target);
      } catch (primaryErr) {
        // ipapi.co failed (often a daily-limit 429) — fall back to freeipapi.com.
        data = await fetchFreeipapi(target);
      }
      setState({ status: "ok", data });
    } catch (e) {
      setState({ status: "error", message: "Both providers failed — you may have hit a rate limit, or the address is invalid." });
    }
  }, [query]);

  const lookupMyIp = React.useCallback(async () => {
    setState({ status: "loading" });
    try {
      const ipv4 = await fetchMyIpv4();
      setQuery(ipv4);
      lookup(ipv4);
    } catch (e) {
      // ipify unavailable — fall back to the provider's own-IP endpoint (may be IPv6).
      setQuery("");
      lookup("");
    }
  }, [lookup]);

  const d = state.status === "ok" ? state.data : null;
  const coords = d && d.latitude != null ? `${d.latitude}, ${d.longitude}` : null;
  const mapUrl = d && d.latitude != null ? `https://www.openstreetmap.org/?mlat=${d.latitude}&mlon=${d.longitude}#map=10/${d.latitude}/${d.longitude}` : null;
  const country = d ? (d.country_name ? `${d.country_name}${d.country_code ? " (" + d.country_code + ")" : ""}` : null) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <Input mono placeholder="IPv4 / IPv6 address — blank for your own"
            value={query} onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") lookup(); }} />
        </div>
        <Button variant="primary" icon="search" onClick={() => lookup()} disabled={state.status === "loading"}>
          {state.status === "loading" ? "Looking up…" : "Look up"}
        </Button>
        <Button variant="secondary" icon="locate-fixed" onClick={lookupMyIp} disabled={state.status === "loading"}>My IP</Button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {state.status === "idle" ? (
          <EmptyState icon="map-pin" title="Geolocate an IP address" hint="Enter an IPv4 or IPv6 address, or use “My IP”. Results come from ipapi.co (with freeipapi.com fallback) over HTTPS." />
        ) : state.status === "error" ? (
          <EmptyState icon="triangle-alert" title="Couldn't look that up" hint={state.message} />
        ) : state.status === "loading" ? (
          <EmptyState icon="loader" title="Looking up…" hint="Querying ipapi.co." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "start" }}>
              <Card title="Address" actions={<CopyButton getText={() => d.ip} label="Copy IP" />}>
                <Row label="IP" value={d.ip} />
                <Row label="Version" value={d.version} />
              </Card>

              <Card title="Location">
                <Row label="City" value={d.city} mono={false} />
                <Row label="Region" value={d.region} mono={false} />
                <Row label="Country" value={country} mono={false} />
                <Row label="Continent" value={d.continent_code} />
                <Row label="Postal" value={d.postal} />
                <Row label="Coordinates" value={coords} />
                {mapUrl ? (
                  <div style={{ paddingTop: 10 }}>
                    <a href={mapUrl} target="_blank" rel="noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-accent)", textDecoration: "none" }}>
                      <Icon name="external-link" size={13} /> View on OpenStreetMap
                    </a>
                  </div>
                ) : null}
              </Card>

              <Card title="Network">
                <Row label="ASN" value={d.asn} />
                <Row label="Organization" value={d.org} mono={false} />
              </Card>

              <Card title="Timezone">
                <Row label="Zone" value={d.timezone} />
                <Row label="UTC offset" value={d.utc_offset} />
                <Row label="Local time" value={localTimeIn(d.timezone)} mono={false} />
              </Card>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-tertiary)" }}>
              <Icon name="database" size={12} /> Data via {d.source}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
