import React from "react";

const css = `
.pkt-panel {
  display: flex; flex-direction: column; min-height: 0; overflow: hidden;
  background: var(--surface-raised);
  border: 1px solid var(--border-default); border-radius: var(--radius-lg);
  font-family: var(--font-sans);
}
.pkt-panel__head {
  flex: none; display: flex; align-items: center; gap: 10px;
  height: 42px; padding: 0 8px 0 14px;
  border-bottom: 1px solid var(--border-subtle);
}
.pkt-panel__title {
  font-size: var(--text-xs); font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-caps); text-transform: uppercase;
  color: var(--text-tertiary);
}
.pkt-panel__meta { margin-left: auto; display: flex; align-items: center; gap: 8px; font-size: var(--text-xs); color: var(--text-tertiary); font-family: var(--font-mono); }
.pkt-panel__actions { display: flex; align-items: center; gap: 6px; }
.pkt-panel__body { flex: 1; min-height: 0; display: flex; flex-direction: column; }

.pkt-panel--code { background: var(--code-bg); border-color: var(--code-bg); }
.pkt-panel--code .pkt-panel__head { border-bottom-color: var(--code-line); }
.pkt-panel--code .pkt-panel__title { color: var(--syn-comment); }
.pkt-panel--code .pkt-panel__meta { color: var(--syn-comment); }
.pkt-panel--sunken { background: var(--surface-sunken); }
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-panel")) {
  const s = document.createElement("style"); s.id = "pkt-css-panel"; s.textContent = css;
  document.head.appendChild(s);
}

/** Workspace pane with a slim header (caps title, mono meta, actions).
    Pair two side-by-side for input → output. variant="code" is the dark pane. */
export function Panel({ title, meta, actions, variant = "raised", children, style }) {
  return (
    <section className={"pkt-panel" + (variant !== "raised" ? " pkt-panel--" + variant : "")} style={style}>
      {(title || meta || actions) ? (
        <header className="pkt-panel__head">
          {title ? <span className="pkt-panel__title">{title}</span> : null}
          <span className="pkt-panel__meta">{meta}</span>
          {actions ? <span className="pkt-panel__actions">{actions}</span> : null}
        </header>
      ) : null}
      <div className="pkt-panel__body">{children}</div>
    </section>
  );
}
