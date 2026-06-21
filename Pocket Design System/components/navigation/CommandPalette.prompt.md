The ⌘K command palette — Pocket's primary navigation; bind the shortcut in the shell and pass tools + recents.

```jsx
const [open, setOpen] = React.useState(false);
React.useEffect(() => {
  const onKey = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen(o => !o); }
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, []);

<CommandPalette open={open} onClose={() => setOpen(false)}
  tools={TOOLS} recents={["json-formatter", "uuid"]}
  onSelect={(t) => { openTool(t); setOpen(false); }} />
```

Empty query shows "Recently used" then all tools by category. Arrows + ⏎ + Esc handled internally.
