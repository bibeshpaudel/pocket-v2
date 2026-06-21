Single-line text input on a sunken well with amber focus; add `mono` for copyable values.

```jsx
<Input label="Secret key" mono placeholder="Paste your key" hint="Never leaves your browser" />
<Input label="Rows" type="number" value={n} onChange={e => setN(e.target.value)} />
<Input mono error="Not a valid URL" value={url} />
```
