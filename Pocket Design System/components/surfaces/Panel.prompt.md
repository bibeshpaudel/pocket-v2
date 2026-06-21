Workspace pane with slim caps header; pair two side-by-side so input and output stay visible together.

```jsx
<Panel title="Input" variant="sunken" meta="2,148 chars"
  actions={<IconButton icon="x" label="Clear" size="sm" />}>
  <Textarea bare style={{ flex: 1 }} />
</Panel>
<Panel title="Output" variant="code" meta={<Badge kind="ok" dot>Valid</Badge>}
  actions={<CopyButton onDark getText={() => out} />}>
  <pre>…</pre>
</Panel>
```

`code` is the signature dark pane (always dark, both themes).
