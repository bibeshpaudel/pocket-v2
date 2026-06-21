Standard action button; use `primary` (amber, dark ink text) for the single main action of a view, `secondary` for everything else.

```jsx
<Button icon="wand-2" onClick={format}>Format</Button>
<Button variant="secondary" icon="download">Download</Button>
<Button variant="ghost" size="sm">Clear</Button>
<Button variant="danger">Delete file</Button>
```

Variants: primary / secondary / ghost / danger. Sizes: sm 28px / md 34px / lg 40px. Labels are sentence case, ≤3 words. Press state nudges down 0.5px — no scaling.
