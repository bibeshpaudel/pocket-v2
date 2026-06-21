import React from "react";
import { Icon } from "../Pocket Design System/components/core/Icon.jsx";
import { Kbd } from "../Pocket Design System/components/core/Kbd.jsx";
import { ToolCard } from "../Pocket Design System/components/surfaces/ToolCard.jsx";
import { EmptyState } from "../Pocket Design System/components/surfaces/EmptyState.jsx";

const homeStyles = {
  wrap: { maxWidth: 1040, margin: "0 auto", padding: "40px 28px 72px" },
  h1: { fontSize: "var(--text-2xl)", fontWeight: 600, letterSpacing: "var(--tracking-tight)", margin: 0 },
  sub: { margin: "6px 0 0", color: "var(--text-secondary)", fontSize: "var(--text-base)" },
  section: { marginTop: 36 },
  caps: {
    display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
    fontSize: 12, fontWeight: 600, letterSpacing: "var(--tracking-caps)",
    textTransform: "uppercase", color: "var(--text-tertiary)",
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 12 },
};

export function SearchTrigger({ onClick, wide }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button type="button" onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        width: wide ? "100%" : 230, maxWidth: 560, height: wide ? 44 : 32,
        padding: "0 12px", cursor: "text", textAlign: "left",
        background: hover ? "var(--surface-raised)" : "var(--surface-sunken)",
        border: "1px solid " + (hover ? "var(--border-strong)" : "var(--border-default)"),
        borderRadius: "var(--radius-md)", color: "var(--text-tertiary)",
        fontFamily: "var(--font-sans)", fontSize: wide ? 15 : 13,
        transition: "border-color var(--duration-fast) var(--ease-out), background var(--duration-fast) var(--ease-out)",
      }}>
      <Icon name="search" size={wide ? 16 : 14} />
      <span style={{ flex: 1 }}>Search tools…</span>
      <Kbd keys={["⌘", "K"]} />
    </button>
  );
}

export function HomeScreen({ tools, categories, favorites, recents, onOpen, onStar, onOpenPalette }) {
  const favTools = tools.filter((t) => favorites.includes(t.id));
  const recentTools = recents.map((id) => tools.find((t) => t.id === id)).filter(Boolean).slice(0, 4);
  return (
    <div style={homeStyles.wrap}>
      <h1 style={homeStyles.h1}>What do you need?</h1>
      <p style={homeStyles.sub}>{tools.length} tools, all client-side. Nothing you paste leaves your browser.</p>
      <div style={{ marginTop: 20, maxWidth: 560 }}>
        <SearchTrigger wide onClick={onOpenPalette} />
      </div>

      <section style={homeStyles.section}>
        <div style={homeStyles.caps}><Icon name="star" size={13} /> Favorites</div>
        {favTools.length ? (
          <div style={homeStyles.grid}>
            {favTools.map((t) => (
              <ToolCard key={t.id} icon={t.icon} name={t.name} description={t.description}
                starred onStar={() => onStar(t.id)} onClick={() => onOpen(t)} />
            ))}
          </div>
        ) : (
          <EmptyState icon="star" title="No favorites yet" hint="Star a tool and it'll stay here." />
        )}
      </section>

      {recentTools.length ? (
        <section style={homeStyles.section}>
          <div style={homeStyles.caps}><Icon name="history" size={13} /> Recently used</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 10 }}>
            {recentTools.map((t) => (
              <ToolCard key={t.id} compact icon={t.icon} name={t.name} onClick={() => onOpen(t)} />
            ))}
          </div>
        </section>
      ) : null}

      {categories.map((cat) => {
        const list = tools.filter((t) => t.category === cat.id);
        if (!list.length) return null;
        return (
          <section key={cat.id} style={homeStyles.section}>
            <div style={homeStyles.caps}><Icon name={cat.icon} size={13} /> {cat.id}</div>
            <div style={homeStyles.grid}>
              {list.map((t) => (
                <ToolCard key={t.id} icon={t.icon} name={t.name} description={t.description}
                  starred={favorites.includes(t.id)} onStar={() => onStar(t.id)} onClick={() => onOpen(t)} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
