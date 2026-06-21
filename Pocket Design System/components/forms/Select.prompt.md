Native select with Pocket chrome; for option lists too long for a SegmentedControl.

```jsx
<Select options={["UTF-8", "ASCII", "Hex"]} value={enc} onChange={e => setEnc(e.target.value)} />
<Select options={[{ value: "py", label: "Python 3" }, { value: "js", label: "JavaScript" }]} value={lang} onChange={onLang} />
```
