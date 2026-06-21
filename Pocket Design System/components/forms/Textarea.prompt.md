Multi-line input, mono by default — the standard paste-area for code and data.

```jsx
<Textarea placeholder="Paste JSON here…" rows={8} value={v} onChange={e => setV(e.target.value)} />
<Textarea bare style={{ height: "100%" }} />   // chrome-less, inside a Panel
<Textarea mono={false} />                       // prose (e.g. word counter)
```
