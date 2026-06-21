# Pocket app — UI kit

Interactive recreation of the Pocket web app, composed from the design-system primitives (`window.PocketDesignSystem_654e67` via `_ds_bundle.js`).

## What's interactive

- **Home** — greeting, search trigger, Favorites (star/unstar persists), Recently used, all 36 tools grouped by category.
- **⌘K / Ctrl+K** — command palette anywhere; arrows + ⏎ + Esc; empty query shows recents.
- **JSON Formatter** (`json-formatter`) — fully working: pretty/minify, indent, sort keys, live validation, syntax-highlighted dark output pane, copy.
- **Password Generator** (`password`) — working: length slider, charset switches, strength badge, regenerate, copy.
- **Theme toggle** — light/dark via `data-theme` on `<html>`.
- All other tools open an honest stub (`StubScreen`) describing the layout they'd follow.

## Files

- `index.html` — entry; loads React UMD + Babel + `_ds_bundle.js` + the JSX below
- `tools-data.js` — the 36-tool catalog, category→icon map, JSON highlighter helper
- `HomeScreen.jsx` — home + `SearchTrigger`
- `ToolScreens.jsx` — `JsonFormatterScreen`, `PasswordScreen`, `StubScreen`
- `App.jsx` — `PocketApp` shell: top bar, routing, favorites/recents/theme persistence (localStorage `pocket-*`)

## Layout rules it demonstrates

- Top bar 52px, logo left; in a tool: breadcrumb chevron + amber glyph chip + name + star + category badge.
- Tool workspace: options row on top, then input (sunken panel) and output (dark code panel) side by side — both always visible.
- Home content max-width 1040, centered; card grid `minmax(230px, 1fr)`.
