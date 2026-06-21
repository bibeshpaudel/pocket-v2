Inverse-ink confirmation capsule; fix it bottom-center and auto-dismiss after ~2s.

```jsx
<div style={{ position: "fixed", bottom: 24, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: "var(--z-toast)" }}>
  <Toast kind="ok">Copied to clipboard</Toast>
</div>
<Toast kind="danger">Couldn't read that file</Toast>
```

Copies don't need a toast — CopyButton confirms itself.
