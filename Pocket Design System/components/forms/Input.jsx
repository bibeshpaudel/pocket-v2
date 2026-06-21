import React from "react";

const css = `
.pkt-field { display: flex; flex-direction: column; gap: 6px; font-family: var(--font-sans); }
.pkt-field__label { font-size: var(--text-sm); font-weight: var(--weight-medium); color: var(--text-primary); }
.pkt-field__hint { font-size: var(--text-xs); color: var(--text-tertiary); }
.pkt-field__error { font-size: var(--text-xs); color: var(--danger); }

.pkt-input {
  height: 34px; padding: 0 12px; width: 100%;
  font-family: var(--font-sans); font-size: var(--text-base); color: var(--text-primary);
  background: var(--surface-sunken);
  border: 1px solid var(--border-default); border-radius: var(--radius-md);
  transition: border-color var(--duration-fast) var(--ease-out), background var(--duration-fast) var(--ease-out);
}
.pkt-input::placeholder { color: var(--text-tertiary); }
.pkt-input:hover:not(:disabled):not(:focus) { border-color: var(--border-strong); }
.pkt-input:focus { outline: none; border-color: var(--accent); background: var(--surface-raised); box-shadow: 0 0 0 3px var(--accent-soft); }
.pkt-input:disabled { opacity: 0.55; }
.pkt-input--mono { font-family: var(--font-mono); font-size: var(--text-sm); }
.pkt-input--error, .pkt-input--error:focus { border-color: var(--danger); box-shadow: 0 0 0 3px var(--danger-soft); }
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-input")) {
  const s = document.createElement("style"); s.id = "pkt-css-input"; s.textContent = css;
  document.head.appendChild(s);
}

/** Single-line text input on a sunken well; amber focus. */
export function Input({ label, hint, error, mono = false, style, ...rest }) {
  const cls = "pkt-input" + (mono ? " pkt-input--mono" : "") + (error ? " pkt-input--error" : "");
  const input = <input className={cls} {...rest} />;
  if (!label && !hint && !error) return React.cloneElement(input, { style });
  return (
    <label className="pkt-field" style={style}>
      {label ? <span className="pkt-field__label">{label}</span> : null}
      {input}
      {error ? <span className="pkt-field__error">{error}</span>
        : hint ? <span className="pkt-field__hint">{hint}</span> : null}
    </label>
  );
}
