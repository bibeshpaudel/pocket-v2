Square icon-only button for toolbars and card corners; `label` is required (becomes aria-label + tooltip).

```jsx
<IconButton icon="settings-2" label="Settings" />
<IconButton icon="star" label="Favorite" active fill onClick={toggleStar} />
<IconButton icon="x" label="Close" size="sm" />
<IconButton icon="moon" label="Dark mode" variant="outline" />
```

`active` turns it amber — used for starred tools; add `fill` to fill the glyph.
