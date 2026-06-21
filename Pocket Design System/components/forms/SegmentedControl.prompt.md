Compact mode picker for 2–5 short options; the standard way to switch a tool's mode.

```jsx
<SegmentedControl options={["Encode", "Decode"]} value={mode} onChange={setMode} />
<SegmentedControl mono options={["v1", "v4"]} value={ver} onChange={setVer} />
<SegmentedControl mono options={["MD5", "SHA-1", "SHA-256"]} value={algo} onChange={setAlgo} />
```

Use `Select` instead when options are long or many.
