// Pocket app — shell + routing + state (favorites, recents, theme, palette)
const {
  Logo, Icon: PIcon, IconButton: PIconButton, Kbd: PKbd, CommandPalette: PPalette, Badge: PBadge,
} = window.PocketDesignSystem_654e67;

function load(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v == null ? fallback : v;
  } catch (e) { return fallback; }
}
function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* no-op */ } }

function TopBar({ tool, onHome, onOpenPalette, starred, onStar, theme, onTheme }) {
  return (
    <header data-screen-label={tool ? tool.name : "Home"} style={{
      flex: "none", display: "flex", alignItems: "center", gap: 10,
      height: 52, padding: "0 16px",
      background: "var(--surface-app)", borderBottom: "1px solid var(--border-subtle)",
    }}>
      <button type="button" onClick={onHome} style={{ display: "inline-flex", border: "none", background: "transparent", cursor: "pointer", padding: 4, borderRadius: 8 }}>
        <Logo size={24} wordmark={!tool} />
      </button>
      {tool ? (
        <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <PIcon name="chevron-right" size={14} style={{ color: "var(--text-tertiary)" }} />
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 15 }}>
            <span style={{ width: 26, height: 26, borderRadius: 8, background: "var(--accent-soft)", color: "var(--amber-700)", display: "grid", placeItems: "center" }}>
              <PIcon name={tool.icon} size={14} />
            </span>
            {tool.name}
          </span>
          <PIconButton icon="star" label={starred ? "Unstar" : "Star"} size="sm" active={starred} fill onClick={onStar} />
          <PBadge kind="neutral">{tool.category}</PBadge>
        </span>
      ) : null}
      <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        {tool ? <SearchTrigger onClick={onOpenPalette} /> : null}
        <PIconButton icon={theme === "dark" ? "sun" : "moon"} label="Toggle theme" onClick={onTheme} />
      </span>
    </header>
  );
}

function PocketApp() {
  const tools = window.POCKET_TOOLS;
  const categories = window.POCKET_CATEGORIES;
  const [route, setRoute] = React.useState(() => load("pocket-route", null));
  const [favorites, setFavorites] = React.useState(() => load("pocket-favs", ["json-formatter", "password", "uuid"]));
  const [recents, setRecents] = React.useState(() => load("pocket-recents", ["hash", "base64"]));
  const [theme, setTheme] = React.useState(() => load("pocket-theme", "light"));
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    save("pocket-theme", theme);
  }, [theme]);
  React.useEffect(() => { save("pocket-route", route); }, [route]);

  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const tool = route ? tools.find((t) => t.id === route) : null;

  const openTool = (t) => {
    setRoute(t.id);
    setPaletteOpen(false);
    setRecents((r) => {
      const next = [t.id, ...r.filter((id) => id !== t.id)].slice(0, 6);
      save("pocket-recents", next);
      return next;
    });
  };
  const toggleStar = (id) => {
    setFavorites((f) => {
      const next = f.includes(id) ? f.filter((x) => x !== id) : [...f, id];
      save("pocket-favs", next);
      return next;
    });
  };

  let screen = null;
  if (!tool) {
    screen = (
      <div data-screen-label="Home" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <HomeScreen tools={tools} categories={categories} favorites={favorites} recents={recents}
          onOpen={openTool} onStar={toggleStar} onOpenPalette={() => setPaletteOpen(true)} />
      </div>
    );
  } else {
    const body = tool.id === "json-formatter" ? <JsonFormatterScreen />
      : tool.id === "password" ? <PasswordScreen />
      : <StubScreen tool={tool} />;
    screen = (
      <div data-screen-label={tool.name} style={{ flex: 1, minHeight: 0, padding: "14px 16px 16px", display: "flex", flexDirection: "column" }}>
        {body}
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--surface-app)" }}>
      <TopBar tool={tool} onHome={() => setRoute(null)} onOpenPalette={() => setPaletteOpen(true)}
        starred={tool ? favorites.includes(tool.id) : false}
        onStar={() => tool && toggleStar(tool.id)}
        theme={theme} onTheme={() => setTheme(theme === "dark" ? "light" : "dark")} />
      {screen}
      <CommandPaletteHost open={paletteOpen} onClose={() => setPaletteOpen(false)}
        tools={tools} recents={recents} onSelect={openTool} />
    </div>
  );
}

function CommandPaletteHost(props) {
  return <PPalette {...props} />;
}

Object.assign(window, { PocketApp });
