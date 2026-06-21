Home-grid tool entry — amber glyph chip, name, one-line description, star-on-hover.

```jsx
<ToolCard icon="braces" name="JSON Formatter" description="Pretty-print, minify, validate"
  starred={isStarred} onStar={toggle} onClick={openTool} />
<ToolCard compact icon="key-round" name="Password Generator" onClick={openTool} />  // recents row
```

Use the category glyph for `icon` (see readme ICONOGRAPHY). Descriptions ≤1 line.
