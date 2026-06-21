// Pocket app — theme picker for the top bar. Picks the accent palette AND the dark level
// (how dark the dark mode is). Light/dark itself is the separate mode toggle. App-level UI
// from DS Icon/IconButton + tokens. Ids map to rules in theme-overrides.css.
import React from "react";
import { Icon } from "../Pocket Design System/components/core/Icon.jsx";
import { IconButton } from "../Pocket Design System/components/core/IconButton.jsx";

// id must match the data-theme rules in theme-overrides.css. `accent` = swatch color.
export const THEMES = [
  { id: "amber", name: "Amber", accent: "#f59e0b" },
  { id: "forest", name: "Forest", accent: "#6f9a3f" },
  { id: "teal", name: "Teal", accent: "#18a39c" },
  { id: "rose", name: "Rose", accent: "#c9514b" },
  { id: "crimson", name: "Crimson", accent: "#c01f3c" },
  { id: "berry", name: "Berry", accent: "#bb2e8a" },
  { id: "violet", name: "Violet", accent: "#9a5bb3" },
  { id: "slate", name: "Slate", accent: "#8c8273" },
];

// id must match the data-dark rules. `sw` = the app background at that level (for the swatch).
export const DARK_LEVELS = [
  { id: "soft", name: "Soft", sw: "#201d19" },
  { id: "dim", name: "Dim", sw: "#171614" },
  { id: "deep", name: "Deep", sw: "#0f0e0d" },
];

const THEME_IDS = new Set(THEMES.map((t) => t.id));
const DARK_IDS = new Set(DARK_LEVELS.map((d) => d.id));
// Old single-value themes → split into a palette / mode / dark-level.
const LEGACY_THEME = {
  sand: "amber", daylight: "amber", "warm-charcoal": "amber", "deep-ink": "amber",
  rosewood: "rose", light: "amber", dark: "amber",
};
const LEGACY_DARK = new Set(["dark", "warm-charcoal", "deep-ink", "forest", "rosewood"]);

export function normalizeTheme(value) {
  if (THEME_IDS.has(value)) return value;
  return LEGACY_THEME[value] || "amber";
}
export function normalizeMode(themeValue, modeValue) {
  if (modeValue === "light" || modeValue === "dark") return modeValue;
  return LEGACY_DARK.has(themeValue) ? "dark" : "light";
}
export function normalizeDark(darkValue, themeValue) {
  if (DARK_IDS.has(darkValue)) return darkValue;
  if (themeValue === "deep-ink" || themeValue === "dark") return "deep";
  if (themeValue === "warm-charcoal") return "soft";
  return "dim";
}

const css = `
.pkt-theme { position: relative; display: inline-flex; }
.pkt-theme-menu {
  position: absolute; top: calc(100% + 8px); right: 0; z-index: var(--z-overlay);
  width: 220px; max-height: 72vh; overflow-y: auto; padding: 6px; font-family: var(--font-sans);
  background: var(--surface-raised); border: 1px solid var(--border-default);
  border-radius: var(--radius-lg); box-shadow: var(--shadow-3);
  animation: pkt-theme-rise var(--duration-fast) var(--ease-out);
}
@keyframes pkt-theme-rise { from { opacity: 0; transform: translateY(-4px); } }
.pkt-theme-menu__label {
  padding: 8px 10px 6px; font-size: 11px; font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-caps); text-transform: uppercase; color: var(--text-tertiary);
}
.pkt-theme-sep { height: 1px; margin: 6px 4px; background: var(--border-subtle); }
.pkt-theme-opt {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 8px 10px; border: none; border-radius: var(--radius-md);
  background: transparent; cursor: pointer; text-align: left;
  font-family: var(--font-sans); font-size: var(--text-base); color: var(--text-primary);
}
.pkt-theme-opt:hover, .pkt-theme-opt--on { background: var(--surface-hover); }
.pkt-theme-sw {
  width: 18px; height: 18px; flex: none; border-radius: var(--radius-sm);
  border: 1px solid var(--border-strong);
}
.pkt-theme-name { flex: 1; min-width: 0; }
.pkt-theme-levels { display: flex; gap: 6px; padding: 2px 4px 4px; }
.pkt-theme-level {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px;
  padding: 7px 4px; border: 1px solid var(--border-default); border-radius: var(--radius-md);
  background: transparent; cursor: pointer; font-family: var(--font-sans);
  font-size: 11px; color: var(--text-secondary);
}
.pkt-theme-level:hover { border-color: var(--border-strong); }
.pkt-theme-level--on { border-color: var(--accent); color: var(--text-primary); }
.pkt-theme-levelsw { width: 100%; height: 22px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); }
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-theme")) {
  const s = document.createElement("style"); s.id = "pkt-css-theme"; s.textContent = css;
  document.head.appendChild(s);
}

export function ThemePicker({ theme, onChange, dark, onSetDark }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="pkt-theme" ref={ref}>
      <IconButton icon="palette" label="Theme" active={open} onClick={() => setOpen((o) => !o)} />
      {open ? (
        <div className="pkt-theme-menu" role="menu" aria-label="Theme">
          <div className="pkt-theme-menu__label">Theme</div>
          {THEMES.map((t) => (
            <button key={t.id} type="button" role="menuitemradio" aria-checked={t.id === theme}
              className={"pkt-theme-opt" + (t.id === theme ? " pkt-theme-opt--on" : "")}
              onClick={() => onChange(t.id)}>
              <span className="pkt-theme-sw" style={{ background: t.accent }} />
              <span className="pkt-theme-name">{t.name}</span>
              {t.id === theme ? <Icon name="check" size={15} style={{ color: "var(--text-accent)" }} /> : null}
            </button>
          ))}

          <div className="pkt-theme-sep" />
          <div className="pkt-theme-menu__label">Dark level</div>
          <div className="pkt-theme-levels">
            {DARK_LEVELS.map((l) => (
              <button key={l.id} type="button" aria-pressed={l.id === dark}
                className={"pkt-theme-level" + (l.id === dark ? " pkt-theme-level--on" : "")}
                onClick={() => onSetDark(l.id)}>
                <span className="pkt-theme-levelsw" style={{ background: l.sw }} />
                {l.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
