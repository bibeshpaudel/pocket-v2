// Pocket app — left navigation sidebar (collapsible, with search).
// App-level layout built only from DS tokens + DS primitives (Icon, IconButton),
// matching the CommandPalette / Home visual language. No new design-system styles.
import React from "react";
import { Icon } from "../Pocket Design System/components/core/Icon.jsx";
import { IconButton } from "../Pocket Design System/components/core/IconButton.jsx";

const WIDTH_OPEN = 248;
const WIDTH_COLLAPSED = 56;

const css = `
.pkt-sb {
  flex: none; display: flex; flex-direction: column; min-height: 0; height: 100%;
  background: var(--surface-app); border-right: 1px solid var(--border-subtle);
  font-family: var(--font-sans); overflow: hidden;
  transition: width var(--duration-base) var(--ease-out);
}
.pkt-sb__head {
  flex: none; display: flex; align-items: center; gap: 8px;
  height: 52px; padding: 0 10px; box-sizing: border-box;
  border-bottom: 1px solid var(--border-subtle);
}
.pkt-sb--collapsed .pkt-sb__head { justify-content: center; padding: 0; }
.pkt-sb__search {
  flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px;
  height: 34px; padding: 0 10px; color: var(--text-tertiary);
  background: var(--surface-sunken); border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
}
.pkt-sb__search input {
  flex: 1; min-width: 0; border: none; outline: none; background: transparent;
  font-family: var(--font-sans); font-size: var(--text-sm); color: var(--text-primary);
}
.pkt-sb__search input::placeholder { color: var(--text-tertiary); }
.pkt-sb__nav {
  flex: 1; min-height: 0; overflow-y: auto; padding: 8px;
  display: flex; flex-direction: column; gap: 2px;
}
.pkt-sb--collapsed .pkt-sb__nav { padding: 8px 6px; align-items: center; }
.pkt-sb__group {
  padding: 12px 8px 4px; font-size: 11px; font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-caps); text-transform: uppercase; color: var(--text-tertiary);
}
.pkt-sb__item {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 8px 10px; border: none; border-radius: var(--radius-md);
  background: transparent; cursor: pointer; text-align: left;
  font-family: var(--font-sans); font-size: var(--text-base); color: var(--text-secondary);
  transition: background var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out);
}
.pkt-sb--collapsed .pkt-sb__item { width: 40px; height: 40px; padding: 0; justify-content: center; }
.pkt-sb__item:hover { background: var(--surface-hover); color: var(--text-primary); }
.pkt-sb__item--on { background: var(--accent-soft); color: var(--text-accent); font-weight: var(--weight-medium); }
.pkt-sb__glyph { display: inline-flex; flex: none; color: var(--text-tertiary); }
.pkt-sb__item:hover .pkt-sb__glyph, .pkt-sb__item--on .pkt-sb__glyph { color: var(--amber-600); }
.pkt-sb__label { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pkt-sb__cat { margin-left: auto; font-family: var(--font-mono); font-size: 11px; color: var(--text-tertiary); }
.pkt-sb__empty { padding: 16px 10px; font-size: var(--text-sm); color: var(--text-tertiary); }
.pkt-sb-tip {
  position: fixed; z-index: var(--z-toast); transform: translateY(-50%);
  padding: 4px 9px; border-radius: var(--radius-sm);
  background: var(--surface-inverse); color: var(--text-inverse);
  font-family: var(--font-sans); font-size: var(--text-xs); font-weight: var(--weight-medium);
  white-space: nowrap; pointer-events: none; box-shadow: var(--shadow-2);
}
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-sidebar")) {
  const s = document.createElement("style"); s.id = "pkt-css-sidebar"; s.textContent = css;
  document.head.appendChild(s);
}

export function Sidebar({ tools, categories, activeId, collapsed, onToggleCollapse, onOpen }) {
  const [query, setQuery] = React.useState("");
  const [tip, setTip] = React.useState(null);
  const inputRef = React.useRef(null);
  const prevCollapsed = React.useRef(collapsed);
  const focusPending = React.useRef(false);

  // When expanded via the collapsed-mode search button, focus the input.
  React.useEffect(() => {
    if (prevCollapsed.current && !collapsed && focusPending.current) {
      focusPending.current = false;
      if (inputRef.current) inputRef.current.focus();
    }
    prevCollapsed.current = collapsed;
  }, [collapsed]);

  const expandAndSearch = () => { focusPending.current = true; onToggleCollapse(); };

  const q = query.trim().toLowerCase();
  const matches = q
    ? tools.filter((t) => (t.name + " " + (t.category || "")).toLowerCase().includes(q))
    : null;

  const showTip = (label) => (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTip({ label, x: r.right + 8, y: r.top + r.height / 2 });
  };
  const hideTip = () => setTip(null);

  const renderItem = (t) => {
    const on = t.id === activeId;
    return (
      <button key={t.id} type="button" aria-label={t.name}
        className={"pkt-sb__item" + (on ? " pkt-sb__item--on" : "")}
        onClick={(e) => { hideTip(); onOpen(t); }}
        onMouseEnter={collapsed ? showTip(t.name) : undefined}
        onMouseLeave={collapsed ? hideTip : undefined}>
        <span className="pkt-sb__glyph"><Icon name={t.icon || "wrench"} size={18} /></span>
        {!collapsed ? <span className="pkt-sb__label">{t.name}</span> : null}
      </button>
    );
  };

  return (
    <>
    <aside className={"pkt-sb" + (collapsed ? " pkt-sb--collapsed" : "")}
      style={{ width: collapsed ? WIDTH_COLLAPSED : WIDTH_OPEN }}>
      <div className="pkt-sb__head">
        {collapsed ? (
          <IconButton icon="panel-left-open" label="Expand sidebar" onClick={onToggleCollapse} />
        ) : (
          <>
            <div className="pkt-sb__search">
              <Icon name="search" size={15} />
              <input ref={inputRef} value={query} placeholder="Search tools…"
                onChange={(e) => setQuery(e.target.value)} />
            </div>
            <IconButton icon="panel-left-close" label="Collapse sidebar" onClick={onToggleCollapse} />
          </>
        )}
      </div>

      <nav className="pkt-sb__nav">
        {collapsed ? (
          <>
            <IconButton icon="search" label="Search tools" onClick={expandAndSearch} />
            {tools.map(renderItem)}
          </>
        ) : matches ? (
          matches.length ? matches.map((t) => (
            <button key={t.id} type="button"
              className={"pkt-sb__item" + (t.id === activeId ? " pkt-sb__item--on" : "")}
              onClick={() => onOpen(t)}>
              <span className="pkt-sb__glyph"><Icon name={t.icon || "wrench"} size={18} /></span>
              <span className="pkt-sb__label">{t.name}</span>
              <span className="pkt-sb__cat">{t.category}</span>
            </button>
          )) : (
            <div className="pkt-sb__empty">No tools match “{query}”.</div>
          )
        ) : (
          categories.map((cat) => {
            const list = tools.filter((t) => t.category === cat.id);
            if (!list.length) return null;
            return (
              <React.Fragment key={cat.id}>
                <div className="pkt-sb__group">{cat.id}</div>
                {list.map(renderItem)}
              </React.Fragment>
            );
          })
        )}
      </nav>
    </aside>
    {collapsed && tip ? (
      <div className="pkt-sb-tip" style={{ left: tip.x, top: tip.y }}>{tip.label}</div>
    ) : null}
    </>
  );
}
