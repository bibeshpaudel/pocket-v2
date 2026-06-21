import React from "react";
import { Icon } from "../core/Icon.jsx";

const css = `
.pkt-toolcard {
  position: relative; display: flex; flex-direction: column; gap: 10px; text-align: left;
  padding: 14px 16px; cursor: pointer; font-family: var(--font-sans); width: 100%;
  background: var(--surface-raised);
  border: 1px solid var(--border-default); border-radius: var(--radius-lg);
  transition: border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out);
}
.pkt-toolcard:hover { border-color: var(--border-strong); box-shadow: var(--shadow-1); }
.pkt-toolcard:active { transform: translateY(0.5px); }
.pkt-toolcard__glyph {
  width: 34px; height: 34px; border-radius: var(--radius-md);
  display: grid; place-items: center;
  background: var(--accent-soft); color: var(--amber-700);
}
.pkt-toolcard__name { font-size: var(--text-base); font-weight: var(--weight-semibold); color: var(--text-primary); }
.pkt-toolcard__desc { font-size: var(--text-sm); color: var(--text-secondary); line-height: var(--leading-snug); }
.pkt-toolcard__star {
  position: absolute; top: 10px; right: 10px;
  width: 26px; height: 26px; border: none; border-radius: var(--radius-sm);
  display: grid; place-items: center; background: transparent; cursor: pointer;
  color: var(--text-tertiary); opacity: 0; transition: opacity var(--duration-fast) var(--ease-out);
}
.pkt-toolcard:hover .pkt-toolcard__star { opacity: 1; }
.pkt-toolcard__star:hover { color: var(--amber-600); background: var(--surface-hover); }
.pkt-toolcard__star--on { opacity: 1; color: var(--amber-500); }
.pkt-toolcard__star--on svg { fill: currentColor; }

.pkt-toolcard--row { flex-direction: row; align-items: center; padding: 10px 14px; gap: 12px; }
.pkt-toolcard--row .pkt-toolcard__glyph { width: 30px; height: 30px; }
.pkt-toolcard--row .pkt-toolcard__desc { display: none; }
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-toolcard")) {
  const s = document.createElement("style"); s.id = "pkt-css-toolcard"; s.textContent = css;
  document.head.appendChild(s);
}

/** Home-grid tool entry: amber glyph chip, name, one-line description,
    star-on-hover. compact=true renders a row (for "Recently used"). */
export function ToolCard({ icon = "wrench", name, description, starred = false, onStar, onClick, compact = false }) {
  return (
    <div
      className={"pkt-toolcard" + (compact ? " pkt-toolcard--row" : "")}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" && onClick) onClick(e); }}
    >
      <span className="pkt-toolcard__glyph"><Icon name={icon} size={17} /></span>
      <span style={{ minWidth: 0 }}>
        <span className="pkt-toolcard__name" style={{ display: "block" }}>{name}</span>
        {description ? <span className="pkt-toolcard__desc" style={{ display: "block", marginTop: 1 }}>{description}</span> : null}
      </span>
      {onStar ? (
        <button
          type="button"
          className={"pkt-toolcard__star" + (starred ? " pkt-toolcard__star--on" : "")}
          aria-label={starred ? "Unstar" : "Star"}
          onClick={(e) => { e.stopPropagation(); onStar(); }}
        ><Icon name="star" size={14} /></button>
      ) : null}
    </div>
  );
}
