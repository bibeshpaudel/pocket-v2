import React from "react";
import { Icon } from "../core/Icon.jsx";
import { Kbd } from "../core/Kbd.jsx";

const css = `
.pkt-cp-overlay {
  position: fixed; inset: 0; z-index: var(--z-overlay);
  background: rgba(30, 26, 20, 0.35);
  display: flex; justify-content: center; align-items: flex-start; padding-top: 12vh;
  animation: pkt-cp-fade var(--duration-fast) var(--ease-out);
}
.pkt-cp {
  width: 580px; max-width: calc(100vw - 48px);
  background: var(--surface-raised); border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl); box-shadow: var(--shadow-3); overflow: hidden;
  font-family: var(--font-sans);
  animation: pkt-cp-rise var(--duration-base) var(--ease-out);
}
@keyframes pkt-cp-fade { from { opacity: 0; } }
@keyframes pkt-cp-rise { from { opacity: 0; transform: translateY(8px); } }
.pkt-cp__search {
  display: flex; align-items: center; gap: 10px; padding: 14px 16px;
  border-bottom: 1px solid var(--border-subtle); color: var(--text-tertiary);
}
.pkt-cp__input {
  flex: 1; border: none; outline: none; background: transparent;
  font-family: var(--font-sans); font-size: var(--text-md); color: var(--text-primary);
}
.pkt-cp__input::placeholder { color: var(--text-tertiary); }
.pkt-cp__list { max-height: 348px; overflow-y: auto; padding: 6px; }
.pkt-cp__group {
  padding: 10px 10px 4px; font-size: 11px; font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-caps); text-transform: uppercase; color: var(--text-tertiary);
}
.pkt-cp__item {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 8px 10px; border: none; border-radius: var(--radius-md);
  background: transparent; cursor: pointer; text-align: left;
  font-family: var(--font-sans); font-size: var(--text-base); color: var(--text-primary);
}
.pkt-cp__item--on { background: var(--surface-hover); }
.pkt-cp__item .pkt-cp__glyph { color: var(--text-tertiary); display: inline-flex; }
.pkt-cp__item--on .pkt-cp__glyph { color: var(--amber-600); }
.pkt-cp__cat { margin-left: auto; font-family: var(--font-mono); font-size: 11px; color: var(--text-tertiary); }
.pkt-cp__empty { padding: 24px; text-align: center; font-size: var(--text-sm); color: var(--text-tertiary); }
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-cp")) {
  const s = document.createElement("style"); s.id = "pkt-css-cp"; s.textContent = css;
  document.head.appendChild(s);
}

/** ⌘K command palette — Pocket's primary navigation.
    Owner binds the shortcut and passes open/onClose/onSelect. */
export function CommandPalette({ open, onClose, tools = [], recents = [], onSelect, placeholder = "Search tools…" }) {
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef(null);
  const listRef = React.useRef(null);
  const isKeyboardNav = React.useRef(false);

  // Build rows: group headers + items, flat for keyboard nav
  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = [];
    if (q) {
      const hits = tools.filter((t) =>
        (t.name + " " + (t.category || "") + " " + (t.keywords || "")).toLowerCase().includes(q));
      hits.forEach((t) => out.push({ type: "item", tool: t }));
    } else {
      const recent = recents.map((id) => tools.find((t) => t.id === id)).filter(Boolean);
      if (recent.length) {
        out.push({ type: "group", label: "Recently used" });
        recent.forEach((t) => out.push({ type: "item", tool: t }));
      }
      const cats = [];
      tools.forEach((t) => { if (!cats.includes(t.category)) cats.push(t.category); });
      cats.forEach((c) => {
        out.push({ type: "group", label: c });
        tools.filter((t) => t.category === c).forEach((t) => out.push({ type: "item", tool: t }));
      });
    }
    return out;
  }, [query, tools, recents]);

  const itemIdx = rows.map((r, i) => (r.type === "item" ? i : -1)).filter((i) => i >= 0);

  React.useEffect(() => {
    if (open) { setQuery(""); setActive(0); isKeyboardNav.current = false; setTimeout(() => inputRef.current && inputRef.current.focus(), 0); }
  }, [open]);

  React.useEffect(() => { setActive(0); isKeyboardNav.current = false; }, [query]);

  React.useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); onClose && onClose(); }
      else if (e.key === "ArrowDown") {
        e.preventDefault();
        isKeyboardNav.current = true;
        setActive((a) => Math.min(a + 1, itemIdx.length - 1));
      }
      else if (e.key === "ArrowUp") {
        e.preventDefault();
        isKeyboardNav.current = true;
        setActive((a) => Math.max(a - 1, 0));
      }
      else if (e.key === "Enter") {
        e.preventDefault();
        const row = rows[itemIdx[active]];
        if (row && onSelect) onSelect(row.tool);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, rows, active, itemIdx, onClose, onSelect]);

  React.useEffect(() => {
    if (!isKeyboardNav.current) return;
    const el = listRef.current && listRef.current.querySelector(".pkt-cp__item--on");
    if (el && listRef.current) {
      const list = listRef.current;
      const top = el.offsetTop; const bottom = top + el.offsetHeight;
      if (top < list.scrollTop) list.scrollTop = top - 6;
      else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight + 6;
    }
  }, [active, rows]);

  if (!open) return null;

  let itemCounter = -1;
  return (
    <div className="pkt-cp-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}>
      <div className="pkt-cp" role="dialog" aria-label="Command palette">
        <div className="pkt-cp__search">
          <Icon name="search" size={17} />
          <input ref={inputRef} className="pkt-cp__input" value={query} placeholder={placeholder}
            onChange={(e) => setQuery(e.target.value)} />
          <Kbd>Esc</Kbd>
        </div>
        <div className="pkt-cp__list" ref={listRef}>
          {rows.length === 0 ? <div className="pkt-cp__empty">No tools match “{query}”.</div> : null}
          {rows.map((row, i) => {
            if (row.type === "group") return <div key={"g" + i} className="pkt-cp__group">{row.label}</div>;
            itemCounter += 1;
            const idx = itemCounter;
            const on = idx === active;
            return (
              <button key={row.tool.id + "-" + i} type="button"
                className={"pkt-cp__item" + (on ? " pkt-cp__item--on" : "")}
                onMouseEnter={() => {
                  isKeyboardNav.current = false;
                  setActive(idx);
                }}
                onClick={() => onSelect && onSelect(row.tool)}>
                <span className="pkt-cp__glyph"><Icon name={row.tool.icon || "wrench"} size={16} /></span>
                {row.tool.name}
                <span className="pkt-cp__cat">{row.tool.category}</span>
                {on ? <Kbd>⏎</Kbd> : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
