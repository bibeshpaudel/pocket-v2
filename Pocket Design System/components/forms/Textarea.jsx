import React from "react";

const css = `
.pkt-textarea {
  display: block; width: 100%; min-height: 96px; padding: 10px 12px; resize: vertical;
  font-family: var(--font-mono); font-size: var(--text-sm); line-height: var(--leading-code);
  color: var(--text-primary); background: var(--surface-sunken);
  border: 1px solid var(--border-default); border-radius: var(--radius-md);
  transition: border-color var(--duration-fast) var(--ease-out), background var(--duration-fast) var(--ease-out);
}
.pkt-textarea::placeholder { color: var(--text-tertiary); }
.pkt-textarea:hover:not(:disabled):not(:focus) { border-color: var(--border-strong); }
.pkt-textarea:focus { outline: none; border-color: var(--accent); background: var(--surface-raised); box-shadow: 0 0 0 3px var(--accent-soft); }
.pkt-textarea--sans { font-family: var(--font-sans); font-size: var(--text-base); line-height: var(--leading-normal); }
.pkt-textarea--bare { border: none; border-radius: 0; background: transparent; resize: none; }
.pkt-textarea--bare:focus { background: transparent; box-shadow: none; }
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-textarea")) {
  const s = document.createElement("style"); s.id = "pkt-css-textarea"; s.textContent = css;
  document.head.appendChild(s);
}

/** Multi-line input; mono by default (Pocket inputs are usually code/data).
    bare=true strips the chrome for use inside a Panel. */
export function Textarea({ mono = true, bare = false, style, ...rest }) {
  const cls = "pkt-textarea" + (mono ? "" : " pkt-textarea--sans") + (bare ? " pkt-textarea--bare" : "");
  return <textarea className={cls} style={style} spellCheck={false} {...rest} />;
}
