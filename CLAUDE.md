# Pocket

A fast, **100% client-side** developer toolkit (formatters, generators, converters, debuggers).
Warm "paper-and-ink" aesthetic, amber accent, keyboard-first, ⌘K command palette. 45 tools
across 10 categories. Built by **assembling a pre-made design system** — see the strict contract below.

## Commands

```bash
npm run dev      # Vite dev server → http://localhost:3000 (auto-opens)
npm run build    # production build to dist/  (currently builds clean)
npm run preview  # serve the built dist/
npm test         # Vitest run (engine unit tests, node env)
npm run test:watch  # Vitest in watch mode
npm run icons    # regenerate the vendored Lucide icon map (also runs pre dev/build)
```

Node + Vite 5 + React 18. **Tests:** Vitest (`vitest.config.js`, kept separate from
`vite.config.js` so the prod build never imports vitest); specs live next to source as
`*.test.js` (currently `csv-shared.test.js`, `text-convert.test.js`, and `cron-util.test.js` in
`src/tools/` cover the CSV, text-convert, and cron engines). No linter wired in yet.
A `predev`/`prebuild` hook runs `scripts/build-icons.mjs` to (re)generate the local icon map.

## Repo layout

```
Pocket/
├── Pocket Design System/      ← VENDORED design system. Treat as read-only source of truth.
│   ├── components/            ← React primitives (core / forms / surfaces / navigation)
│   │   └── <Name>.jsx + .d.ts (props) + .prompt.md (usage notes)
│   ├── tokens/*.css           ← colors, typography, spacing/radii/shadows/motion, fonts, base
│   ├── styles.css             ← global CSS entry (imports all tokens) — linked from index.html
│   ├── templates/tool-page/   ← ToolPage.dc.html = canonical tool layout (reference only)
│   ├── ui_kits/pocket_app/    ← original window-global recreation the src/ app is ported from
│   ├── guidelines/*.html       ← visual specimen cards
│   ├── _ds_manifest.json       ← every token + component, machine-readable
│   ├── _adherence.oxlintrc.json← lint rules: exact allowed props per component, no raw hex/px
│   └── readme.md / SKILL.md     ← brand voice + visual foundations (read for design decisions)
├── src/                        ← THE ACTUAL APP (Vite + React, ESM)
│   ├── main.jsx                ← ReactDOM root + <BrowserRouter>
│   ├── App.jsx                 ← shell: TopBar, routes, lazy registry, favorites/recents/theme
│   ├── HomeScreen.jsx          ← dashboard: ToolCard grid grouped by category + ⌘K trigger
│   ├── ToolScreens.jsx         ← all tool screens (one exported component each)
│   └── tools-data.js           ← POCKET_TOOLS catalog, POCKET_CATEGORIES, JSON/XML highlighters
├── index.html                  ← links the DS styles.css + mounts /src/main.jsx
└── vite.config.js              ← React plugin, port 3000
```

The app imports DS components by **direct path into the folder**, e.g.
`import { Panel } from "../Pocket Design System/components/surfaces/Panel.jsx"`.
(The adherence config nominally wants imports from an `index.js` barrel, but none exists; importing
internals is the established pattern here and builds fine.)

## Architecture / data flow

- **Routing** (`App.jsx`): `react-router-dom`. `/` = home, `/tool/:toolId` = a tool. The tool is
  resolved from `POCKET_TOOLS` by id. Legacy alias: `json` → `json-formatter`.
- **Tool registry**: `TOOL_REGISTRY` maps `toolId → React.lazy(() => import("./ToolScreens.jsx"))`.
  Unmapped ids fall back to `StubScreen` (an `EmptyState`). **All tool screens live in one
  `ToolScreens.jsx`**, code-split via lazy + dynamic import (so adding one tool grows one chunk).
- **State** (`App.jsx`, persisted to `localStorage`): `pocket-favs`, `pocket-recents`,
  `pocket-theme`, `pocket-mode`, `pocket-dark`, `pocket-nav-collapsed`.
- **Theming** = **theme (palette) × mode (light/dark) × dark-level**, all orthogonal. `<html>`
  carries `data-theme="<palette>"`, `data-mode="light|dark"`, and `data-dark="soft|dim|deep"`,
  set in `App.jsx`. Rules live in `src/theme-overrides.css` and **remap design-system token
  values only** (no component selectors). `data-mode`+`data-dark` drive the SURFACE ramp (light
  = DS `:root`; dark = a warm-charcoal block with soft/dim/deep darkness levels); `data-theme`
  swaps only the ACCENT family (`--accent*`, `--amber-*`, `--text-accent`, `--text-on-accent`),
  tuned per mode. The surface and accent rules never set the same tokens, so they compose.
  8 themes: `amber` (brand), `forest`, `teal`, `rose`, `crimson`, `berry`, `violet`, `slate` —
  each works in both modes and all dark levels. Top bar: **`ThemePicker`** popover
  (`src/ThemePicker.jsx`) holds the palette grid + the Dark-level selector; a separate sun/moon
  `IconButton` toggles mode. To add a theme: add a `{light,dark}` accent pair in the CSS + a
  `THEMES` entry. `normalizeTheme()`/`normalizeMode()`/`normalizeDark()` migrate legacy settings.
  The DS `Sidebar` is `src/Sidebar.jsx` (collapsible, with search) — app-level, not a DS primitive.
- **⌘K palette**: `CommandPalette` from the DS; App binds the global Cmd/Ctrl+K shortcut and feeds
  it `tools`/`recents`/`onSelect`. Arrows + ⏎ + Esc handled inside the component.

## The design-system contract (HARD RULES)

This is a **system-assembly** project, not a design project. When building/editing tools:

1. **No new UI components, layouts, or styles.** Compose only the existing DS primitives.
2. **Use tokens, never raw values.** No hex colors, no bare `px` — always `var(--token)`.
   (`_adherence.oxlintrc.json` flags raw hex/px and font-families other than Instrument Sans /
   JetBrains Mono.)
3. **Respect each component's declared props** (the adherence file lists them exactly). Key ones:
   - `Panel` — `title, meta, actions, variant('raised'|'sunken'|'code'), children, style`
   - `Badge` — `kind('neutral'|'accent'|'ok'|'warn'|'danger'), dot, children`
   - `Button` — `variant('primary'|'secondary'|'ghost'|'danger'), size('sm'|'md'|'lg'), icon, disabled, onClick`
   - `SegmentedControl` — `options, value, onChange, mono`
   - `Select` — `options[{value,label}], value, onChange(e), disabled, style`
   - `Switch` — `checked, onChange(bool), label, disabled`
   - `CopyButton` — `text | getText(), label, onDark`
   - `Input` — `label, hint, error, mono, placeholder, value, onChange, type, …`
   - `Textarea` — `mono, bare, placeholder, value, onChange, rows, style`
   - `Icon` — `name (lucide id), size, strokeWidth, style`
   - `ToolCard` — `icon, name, description, starred, onStar, onClick, compact`
   - `EmptyState` — `icon, title, hint, style`
4. **Tokens cheat-sheet**: surfaces `--surface-app/raised/sunken/hover`; text `--text-primary/
   secondary/tertiary`; borders `--border-subtle/default/strong`; accent `--amber-500` /
   `--accent-soft`; code pane `--code-bg` / `--code-fg` / `--syn-*`; radii 6/10/14/20
   (`--radius-sm/md/lg/xl`); spacing 4px grid (`--space-*`); fonts `--font-sans` (UI) /
   `--font-mono` (anything copyable). **No blues, no emoji, no gradients.**

## Tool-page layout convention (match `ToolPage.dc.html`)

Every tool screen returns a full-height flex column:
```
<div flex column gap:12 height:100%>
  <options row>            ← SegmentedControl / Select / Switch / Buttons; right-align extras with margin-left:auto
  <div grid 1fr 1fr gap:14 flex:1>
    <Panel variant="sunken" title="Input"  meta={chars} actions={<IconButton icon="x" .../>}>  ← editable input
    <Panel variant="code"   title="Output" meta={<Badge .../>} actions={<CopyButton onDark/>}>  ← dark result pane
  </div>
</div>
```
Validation state goes in the output panel's `meta` as a `<Badge>` (`ok`/`danger`). Parse work is
**debounced** (`setTimeout` ~150–200ms in an effect) and formatting is `useMemo`'d to avoid
re-renders. Output highlighting uses `pocketHighlightJSON` / `pocketHighlightXML` from `tools-data.js`.

**Split/Input/Output view toggle**: `src/split-view.jsx` exports `useSplitView(leftLabel, rightLabel)`
→ `{ control, columns, leftStyle, rightStyle }`. Put `{sv.control}` in the options row, set the grid's
`gridTemplateColumns: sv.columns`, and `style={sv.leftStyle}` / `style={sv.rightStyle}` on the two
panels (hides via `display:none`). Adopted by JSON/XML/Base64/Hash/Case/Word-counter; Markdown has its
own equivalent (`Split|Editor|Preview`).

## How to add / build a tool

1. Ensure it's in `POCKET_TOOLS` (`src/tools-data.js`) with `{id, name, category, icon, description}`.
   `icon` is a [Lucide](https://lucide.dev) id.
2. Write `export function XxxScreen() {…}` in `src/ToolScreens.jsx` following the layout convention.
3. Register it in `App.jsx`: add a `lazy()` import + an entry in `TOOL_REGISTRY` keyed by the tool id.
4. `npm run build` to confirm it compiles.

## Current status (as of 2026-06-21)

**45 tools fully built:** json-formatter, xml-formatter, base64, hash (MD5/SHA-1/256/512/SHA3/
BLAKE2/BLAKE3), unit, timestamp, timezone, password, qr-code, lorem-ipsum, uuid (v1/v4/v7), case,
word-counter, regex, **url-codec** (encode/decode + URL parser) (all in `ToolScreens.jsx`);
**git-cheatsheet**, **diff**, **markdown**, **aes**, **jwt**, **cert-inspector**, **mermaid**,
**compiler**, **syntax**, **ip-lookup**, **dns-lookup**, **image-compressor**, **image-converter**,
**svg-viewer**, **image-analyzer**, **pdf-to-text**, **merge-pdfs**, **word-to-pdf**, **csv-json**,
**csv-sql**, **csv-editor**, **color-converter**, **number-base**, **json-yaml**, **cron**,
**env-json**, **text-escape**, **slugify**, **ulid**, **sample-data** (in
`src/tools/`, own lazy chunks + data/engine files — the preferred pattern for heavier tools). The
three **PDF** tools share `src/tools/file-shared.jsx` (generic Dropzone + read/download/formatBytes,
also for future CSV tools) and are fully client-side: **pdf-to-text** extracts the text layer with
`pdfjs-dist` (worker via `?url` import; scanned/image PDFs have no text layer — no OCR);
**merge-pdfs** combines + reorders with `pdf-lib`; **word-to-pdf** converts .docx→HTML with
`mammoth` (browser bundle); **Download PDF** opens the browser's print engine (hidden-iframe
dialog → "Save as PDF") for high-fidelity, selectable-text output that best preserves complex
layout, images and page breaks. Plus HTML download. Preview is a forced-light white "paper"
(`.docx-page` colours set `!important`). **syntax** (Syntax Highlighter) colourises with `highlight.js`
(auto-detect uses a common-language subset to avoid mis-detecting short snippets); themes are JS
scope→colour maps (Pocket reads the app's `--syn-*` tokens, plus GitHub / One Dark) applied as
**inline styles** so Copy-rich / Copy-HTML / Download produce portable colour that pastes into docs. **mermaid** is a live diagrams-from-text editor (templates,
theme, zoom, SVG/PNG export) using the `mermaid` lib at `securityLevel: "strict"` — its own ~141
kB-gzip lazy chunk (mermaid further self-splits each diagram type at runtime). **compiler** (Online
Compiler) is multi-language: **Web (HTML/CSS/JS)** renders live in a sandboxed `<iframe srcDoc>`
(`sandbox="allow-scripts allow-modals"`, local); **JavaScript** runs locally in a sandboxed Web
Worker (5s timeout); **Python** runs locally via Pyodide (CPython→WASM; runtime lazy-loaded from the
jsDelivr CDN via a `/* @vite-ignore */` dynamic import, NOT an npm dep); **TypeScript, C, C++, C#,
Java, Go, Rust, Ruby, PHP, Bash** compile/run on the public **Wandbox** API (wandbox.org — free,
key-less, CORS) so that code leaves the browser (shown with a warning banner). NOTE: the public
Piston API went whitelist-only in Feb 2026 — Wandbox replaced it. Compiler ids are pinned in `LANGS`
(e.g. Java needs a non-public `class Main` since Wandbox saves to prog.java). stdin supported for
local-Python + all remote langs; ⌘/Ctrl+Enter runs.
**jwt** decodes header/payload + encodes/signs, verifying with Web Crypto — HMAC (HS*) via secret,
RSA (RS*/PS*) and ECDSA (ES*) via PEM (SPKI public to verify, PKCS#8 private to sign) — client-side.
**cert-inspector** parses X.509 certs (PEM/DER, chains) via `@peculiar/x509` **v1** (v2 pulls in
tsyringe/reflect-metadata — avoid) and verifies arbitrary signatures with Web Crypto (RSA PKCS#1/
PSS, ECDSA incl. DER→P1363); dev-only — shows a disclaimer, does NOT check trust chains/revocation.
The four **image** tools share `src/tools/image-shared.jsx` (Dropzone, canvas `encodeImage`,
`formatBytes`, checkerboard, etc.). **image-analyzer** is the deep one: true format detection via
magic bytes (+type-mismatch flag), PNG IHDR internals (colour type / bit depth / interlace), GIF
frame count, a dominant-colour palette + tonal luminance histogram + brightness/contrast/
transparency/grayscale from a downscaled canvas sample, bits-per-pixel & compression ratio, and EXIF
via the dependency-free `src/tools/exif.js` (JPEG APP1/TIFF → camera/exposure/GPS). All image work is
canvas/File-API, nothing uploaded. **HEIC/HEIF input** is supported across compressor/converter/
analyzer via `ensureDecodable()` in image-shared, which decodes to PNG before the canvas step.
Primary decoder is `heic-to` (modern libheif-wasm — handles recent 10-bit/HDR iPhone photos that
the older `heic2any` libheif rejects); `heic2any` is the fallback. Both are lazy chunks (self-
contained inline WASM, ~734 / ~341 kB gzip) fetched only when a HEIC is opened — `heic2any` only if
`heic-to` throws. Browsers other than Safari can't decode HEIC natively. The original file's
size/name/type are kept for stats; HEIC EXIF isn't parsed yet.
`ip-lookup` (ipapi.co → freeipapi.com fallback, IPv4 via ipify for "My IP") and `dns-lookup` (Google
DNS-over-HTTPS) are network tools by design — the query leaves the browser; all use key-less,
CORS-enabled HTTPS public APIs.

The three **CSV** tools (`src/tools/CsvJson.jsx`, `CsvSql.jsx`, `CsvEditor.jsx`) share a single
pure-JS engine (`src/tools/csv-shared.js`: a single-pass char-scanning CSV parser — no
backtracking-regex — plus streaming JSON/SQL/CSV serializers that hold ≤1 row of intermediates) run
through a **Web Worker** (`csv-worker.js`) via the `csv-engine.js` facade (`runCsv(op, payload,
onProgress)`), so even 100 MB / multi-million-row files never block the main thread; the engine
falls back to a yield-then-run on the main thread if the worker can't be constructed. **No-freeze
strategy:** heavy work is off-thread, and on-screen output is **preview-capped** to `PREVIEW_LIMIT`
(200k chars) while Copy/Download use the full string (never dumped into the DOM); file loads are kept
in a ref, not a `<textarea>`. **csv-json** converts both directions (typed value inference keeps
leading-zero IDs like `007` as strings; objects/arrays shape; pretty toggle). **csv-sql** emits
INSERTs (+ optional CREATE TABLE with sampled type inference) for MySQL/PostgreSQL/SQLite/SQL Server,
with per-dialect identifier quoting + value escaping and multi-row batching. **csv-editor** is a
**virtualised** editable grid (only the visible row window is in the DOM; row count capped at
`EDITOR_ROW_CAP`=50k for editing — larger files show a banner pointing to csv-json/sql for full
conversion); cell edits mutate an in-place ref + force a windowed re-render (O(1) per keystroke). All
fully client-side. No stubs remain.

**Nine small/utility tools** added later (own lazy chunks in `src/tools/`), all client-side: **color-converter**
(parses any CSS color via a 1×1 canvas, computes HEX/RGB/HSL/HSV, swatch + RGBA sliders), **number-base**
(bin/oct/dec/hex + any base 2–36, **BigInt**-backed so no overflow), **json-yaml** (both directions via
`js-yaml` — the only batch dep, bundled into its own ~17 kB-gzip lazy chunk), **cron** (Cron Explainer:
5-field parse → English + per-field breakdown + next-run list; the next-run search steps minute-by-minute
under a 366-day cap so it can't hang), **env-json** (.env ↔ JSON), **text-escape** (HTML-entity / JSON-string /
Unicode escape+unescape), **slugify** (diacritic-stripping, per-line), **ulid** (ULID + NanoID via Web Crypto
RNG), **sample-data** (schema → fake CSV/JSON rows; companion to the CSV tools). The pure, deterministic logic
for these lives in **`src/tools/text-convert.js`** (number base, slugify, env parse/serialize, HTML/JSON/Unicode
escaping) and **`src/tools/cron-util.js`** (parse/describe/next-runs), both framework-free and unit-tested
(`text-convert.test.js`, `cron-util.test.js`). The convert-style tools share **`src/tools/convert-panels.jsx`**
(a 2-panel input→output scaffold). Color/number-base/cron use their own bespoke layouts.

Extra deps installed: `blueimp-md5`, `hash-wasm`, `qrcode`, `react-router-dom`, `heic-to` +
`heic2any` (HEIC decode for the image tools — `heic-to` primary, `heic2any` fallback; both lazy,
own chunks), `@peculiar/x509`@^1 (cert-inspector X.509 parsing, lazy chunk), `mermaid` (mermaid editor, lazy
chunk), `pdfjs-dist` (pdf-to-text) + `pdf-lib` (merge-pdfs) + `mammoth` (word-to-pdf via print engine),
`js-yaml` (json-yaml, lazy chunk) —
all lazy chunks; markdown tool uses
`marked` + `marked-katex-extension` + `marked-highlight` + `marked-footnote` + `katex` +
`highlight.js` + `dompurify` (all in the lazy `MarkdownPreview` chunk, ~160 kB gzip — only loads
when that tool opens).

## Known caveats

- **`Icon` now renders from a locally-vendored Lucide map** (`src/generated/lucide-icons.js`,
  generated by `scripts/build-icons.mjs` from the `lucide-static` dep — it scans source for icon
  names and inlines only those used, ~96 icons). No network needed for vendored icons. The old
  `unpkg.com/lucide-static` runtime fetch remains **only as a fallback** for any icon name the scan
  missed — so a typo'd/new icon still resolves, but the "nothing leaves your browser" claim now holds
  for the normal case. Re-run `npm run icons` (auto via predev/prebuild) after adding new icon names.
- **Tool screens are wrapped in an `ErrorBoundary` + `Suspense`** (`src/ErrorBoundary.jsx`, applied
  in `App.jsx`'s `ToolPageWrapper`): a crashing tool shows a recoverable "Try again" panel instead of
  blanking the app, and the boundary auto-resets on tool change (`resetKey={tool.id}`). Lazy chunks
  show a `ToolLoading` spinner instead of a blank screen.
- Some `ip-lookup` / `dns-lookup` tools are inherently network tools — they won't be purely
  client-side. Decide per-tool whether to use a public API or skip.
- Routing was added (`react-router-dom`) on top of the kit's original `useState` routing — a
  deliberate extension, not part of the original DS kit.
