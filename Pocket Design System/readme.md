# Pocket Design System

**Pocket** is a fast, browser-based toolkit for developers and power users: formatters, generators, converters, debuggers and more — all client-side, instant, keyboard-first, distraction-free.

This design system defines Pocket's brand and UI: warm paper-and-ink surfaces, a single amber accent (from the mark), mono-forward typography, and dense-but-calm layouts where input and output live side by side.

## Sources

- `uploads/favicon.svg` — the only provided brand asset: an amber (#F59E0B) rounded square with a white "P". Everything else in this system was designed from the written brief (warm/earthy, minimal, keyboard-first, no generic SaaS dashboard).
- No codebase, Figma, or font files were provided. Webfonts are Google Fonts substitutes (see Visual Foundations → Type).

## Product context

One product: the **Pocket web app**. ~35 tools across 10 categories:

| Category | Tools |
|---|---|
| Formatters | JSON Formatter, XML Formatter |
| Development | Online Compiler (Python/JS/C++), Git Cheatsheet |
| Generators | QR Code, Password, Lorem Ipsum, UUID (v1/v4), Mermaid Editor |
| Converters | Base64, Unit, Timestamp, Timezone |
| Text | Markdown Previewer, Syntax Highlighter, Text Diff, Case Converter, Word Counter, RegEx Tester |
| Security | Hash Generator (MD5/SHA-1/SHA-256), AES Encrypt/Decrypt, JWT Debugger |
| Images | Image Compressor, SVG Viewer, Image Converter, Image Analyzer |
| PDF | PDF to Text, Merge PDFs, Word to PDF |
| CSV Tools | CSV ↔ JSON, CSV to SQL, CSV Editor |
| Web | URL Encoder/Decoder, IP Lookup, DNS Lookup, CSS Generators |

UX principles: fewest clicks possible; input + output visible together; ⌘K command palette is the primary navigation; favorites + recents on the home screen; everything instant and client-side.

## CONTENT FUNDAMENTALS

- **Voice:** plain, direct, technical-but-friendly. Tools speak like a sharp colleague, not a marketer. No exclamation points, no "supercharge", no "✨".
- **Casing:** Sentence case everywhere — titles, buttons, labels ("Format JSON", "Copy output", "Recently used"). Tool names are Title Case proper nouns ("JSON Formatter"). Category labels render as UPPERCASE with letter-spacing, but are written in sentence case in copy.
- **Person:** address the user as "you", sparingly. Most UI copy is imperative or declarative: "Paste JSON to format it", "Nothing here yet".
- **Brevity:** labels ≤ 3 words; descriptions ≤ 1 line; empty states ≤ 2 short sentences. Numbers and technical values always render in mono.
- **Emoji:** never in UI. Icons (Lucide) carry all pictography.
- **Errors:** state what's wrong and where, in mono when quoting input: ``Unexpected token `}` at line 14``. Never blame the user, never apologize effusively.
- **Keyboard-first:** shortcuts are surfaced inline everywhere (⌘K, ⌘Enter, ⌘C) in `<kbd>` capsules.

Example copy:
- Home greeting: "What do you need?"
- Empty favorites: "Star a tool and it'll stay here."
- Action buttons: "Format", "Copy", "Clear", "Download"
- Success toast: "Copied to clipboard"

## VISUAL FOUNDATIONS

- **Color:** warm paper neutrals ("sand", `#FCFAF5 → #1E1A14`) + one brand hue, amber `#F59E0B`. Functional earth tones: moss (success), clay (danger), ochre (warning). **No blues anywhere.** Light theme is default; dark theme via `<html data-theme="dark">`. Code/output panes are always dark warm charcoal (`--code-bg`) in both themes — the signature motif.
- **Type:** Instrument Sans (UI) + JetBrains Mono (code, values, shortcuts, counts — anything copyable). Base UI size 14px. Headings semibold with tight tracking; category labels uppercase 12px with `--tracking-caps`. *Both are Google Fonts substitutes — no brand fonts were provided.*
- **Spacing:** 4px grid (`--space-*`). Dense but breathing — 16px card padding, 24px section gaps.
- **Backgrounds:** flat paper. No gradients, no textures, no full-bleed imagery. Hierarchy via the three surface levels (app / raised / sunken) + 1px borders.
- **Borders:** 1px solid `--border-default` does most separation work; borders over shadows.
- **Shadows:** near-none at rest. `--shadow-1` on raised cards is optional; `--shadow-3` is reserved for the command palette and dialogs.
- **Corner radii:** 6 / 10 / 14 / 20 (`--radius-sm/md/lg/xl`). Cards 14, controls 10, kbd/tags 6.
- **Cards:** `--surface-raised` + 1px `--border-default` + `--radius-lg`. Flat by default; hover lifts via border-color → `--border-strong` and `--shadow-1`.
- **Hover states:** background shifts one surface step (app → hover) or border darkens. Never opacity fades on text.
- **Press states:** translateY(0.5px) + one step darker background. No scale-downs below 0.98.
- **Focus:** 2px amber outline, 2px offset — always visible, keyboard-first.
- **Motion:** quick fades and 4–8px slides, 120–260ms, `--ease-out`. No bounces, no infinite loops. Command palette: fade + slight rise.
- **Transparency/blur:** only the overlay scrim (`rgba(30,26,20,.35)`); no glassmorphism.
- **Imagery:** none. Pocket is iconographic, not illustrative.
- **Data/code color:** dark warm panes with amber keys, moss-light strings, peach numbers (see `--syn-*` tokens).

## ICONOGRAPHY

- **System:** [Lucide](https://lucide.dev) — 1.5px-stroke outline icons, `currentColor`. Matches the minimal/technical tone. No brand icon set was provided; Lucide is a flagged substitution.
- **Usage:** via the `Icon` component (`components/core/Icon.jsx`), which inlines SVGs fetched from the lucide-static CDN with a local cache, or `<i data-lucide="...">` + the Lucide UMD script in plain HTML.
- **Sizes:** 16px inline / controls, 18px tool-card glyphs, 20px nav. Stroke width stays default (2).
- **Tool glyphs:** each tool category has a fixed Lucide icon (see `components/core/icons-map.js`).
- **Emoji:** never. Unicode glyphs only for keyboard symbols (⌘ ⇧ ⏎) inside `<kbd>`.
- **Logo:** `assets/favicon.svg` (mark). Wordmark = mark + "Pocket" in Instrument Sans semibold (see `components/core/Logo.jsx`).

## Index

- `styles.css` — global CSS entry (imports everything under `tokens/`)
- `tokens/` — colors, typography, spacing/radii/shadows/motion, fonts, base element styles
- `guidelines/` — foundation specimen cards (Design System tab)
- `assets/` — favicon/mark
- `components/core/` — Logo, Icon, Button, IconButton, Kbd, Badge, CopyButton
- `components/forms/` — Input, Textarea, Select, Switch, SegmentedControl
- `components/surfaces/` — ToolCard, Panel, Tabs, EmptyState, Toast
- `components/navigation/` — CommandPalette, Sidebar
- `ui_kits/pocket_app/` — full interactive app recreation (home, ⌘K palette, JSON formatter, password generator) — see its README.md
- `templates/tool-page/` — "Tool page" template (DC): top bar + options row + input/output panels
- `SKILL.md` — agent skill entry point

Components (namespace `window.PocketDesignSystem_654e67` via `_ds_bundle.js`):
core — Logo, Icon, Button, IconButton, Kbd, Badge, CopyButton ·
forms — Input, Textarea, Select, Switch, SegmentedControl ·
surfaces — ToolCard, Panel, Tabs, EmptyState, Toast ·
navigation — CommandPalette.
Each has a sibling `.d.ts` (props) and `.prompt.md` (usage).
