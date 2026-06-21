---
name: pocket-design
description: Use this skill to generate well-branded interfaces and assets for Pocket (a fast, browser-based developer toolkit), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

Pocket in one line: a warm, paper-and-ink, keyboard-first developer toolkit — amber accent, sand neutrals, JetBrains Mono for anything copyable, dark code panes in both themes, no blues, no emoji, no gradients.

Key files:
- `readme.md` — brand context, content fundamentals, visual foundations, iconography
- `styles.css` — global CSS entry (link this one file; it imports all tokens + fonts)
- `tokens/` — colors, typography, spacing/radii/shadows/motion
- `components/` — React primitives (core, forms, surfaces, navigation), each with a `.prompt.md` usage note
- `ui_kits/pocket_app/` — full interactive recreation of the app (home, ⌘K palette, JSON formatter, password generator)
- `templates/tool-page/` — tool-workspace starting point (options row + input/output panels)

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
