Underline tabs for switching views inside one tool (Preview / Source, Output / Errors).

```jsx
<Tabs items={["Preview", "Source"]} active={tab} onChange={setTab} />
```

For tool *modes* (encode/decode), use SegmentedControl instead.
