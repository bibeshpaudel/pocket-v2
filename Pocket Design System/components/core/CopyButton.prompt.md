One-click clipboard button with built-in "Copied" confirmation; place next to every output.

```jsx
<CopyButton text={output} />
<CopyButton getText={() => editor.value} label="Copy SQL" />
<CopyButton text={hash} onDark />   // for dark code panes
```

Confirmation lasts 1.5s and turns moss green. No toast needed for copies.
