// Pocket app — quick notes. A top-bar button opens a notes window (modal) with a
// list of notes + an editor. Everything is kept in localStorage ("pocket-notes") and
// saved automatically on every keystroke — 100% client-side, nothing leaves the browser.
// App-level UI assembled from DS primitives (Icon/IconButton/Button/Input/Textarea + tokens).
import React from "react";
import { Icon } from "../Pocket Design System/components/core/Icon.jsx";
import { IconButton } from "../Pocket Design System/components/core/IconButton.jsx";
import { Button } from "../Pocket Design System/components/core/Button.jsx";
import { Textarea } from "../Pocket Design System/components/forms/Textarea.jsx";
import { EmptyState } from "../Pocket Design System/components/surfaces/EmptyState.jsx";

const STORE_KEY = "pocket-notes";

function loadNotes() {
  try {
    const v = JSON.parse(localStorage.getItem(STORE_KEY));
    return Array.isArray(v) ? v : [];
  } catch (e) {
    return [];
  }
}
function saveNotes(notes) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(notes));
  } catch (e) {
    /* no-op (quota / private mode) */
  }
}

// Stable-ish id without Date.now/Math.random restrictions elsewhere — fine here (browser runtime).
function newId() {
  return "n_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
}

function titleOf(text) {
  const first = (text || "").split("\n").find((l) => l.trim().length > 0);
  return first ? first.trim() : "Untitled note";
}
function previewOf(text) {
  const lines = (text || "").split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.slice(1).join(" ") || "No additional text";
}
function relTime(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return m + "m ago";
  const h = Math.round(m / 60);
  if (h < 24) return h + "h ago";
  const d = Math.round(h / 24);
  return d + "d ago";
}

const css = `
.pkt-notes-overlay {
  position: fixed; inset: 0; z-index: var(--z-modal, 1000);
  display: grid; place-items: center; padding: 24px;
  background: rgba(0,0,0,0.42); font-family: var(--font-sans);
  animation: pkt-notes-fade var(--duration-fast) var(--ease-out);
}
@keyframes pkt-notes-fade { from { opacity: 0; } }
.pkt-notes-win {
  display: flex; flex-direction: column; width: min(900px, 100%); height: min(620px, 100%);
  background: var(--surface-raised); border: 1px solid var(--border-default);
  border-radius: var(--radius-xl); box-shadow: var(--shadow-3); overflow: hidden;
  animation: pkt-notes-rise var(--duration-fast) var(--ease-out);
}
@keyframes pkt-notes-rise { from { opacity: 0; transform: translateY(8px) scale(0.99); } }
.pkt-notes-head {
  flex: none; display: flex; align-items: center; gap: 10px;
  padding: 12px 14px; border-bottom: 1px solid var(--border-subtle);
}
.pkt-notes-head__title { display: inline-flex; align-items: center; gap: 8px; font-weight: var(--weight-semibold); font-size: 15px; }
.pkt-notes-head__icon { width: 26px; height: 26px; border-radius: var(--radius-md); background: var(--accent-soft); color: var(--amber-700); display: grid; place-items: center; }
.pkt-notes-saved { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: var(--text-tertiary); }
.pkt-notes-body { flex: 1; min-height: 0; display: flex; }
.pkt-notes-list {
  flex: none; width: 256px; border-right: 1px solid var(--border-subtle);
  display: flex; flex-direction: column; background: var(--surface-app);
}
.pkt-notes-list__top { flex: none; padding: 10px; }
.pkt-notes-list__scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 0 6px 8px; }
.pkt-notes-item {
  position: relative; width: 100%; text-align: left; cursor: pointer;
  display: flex; flex-direction: column; gap: 3px; padding: 9px 10px; margin-bottom: 4px;
  border: 1px solid transparent; border-radius: var(--radius-md); background: transparent;
  font-family: var(--font-sans);
}
.pkt-notes-item:hover { background: var(--surface-hover); }
.pkt-notes-item--on { background: var(--surface-hover); border-color: var(--border-default); }
.pkt-notes-item__title { font-size: var(--text-sm); font-weight: var(--weight-semibold); color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pkt-notes-item__sub { font-size: 12px; color: var(--text-tertiary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pkt-notes-item__del { position: absolute; top: 6px; right: 6px; opacity: 0; transition: opacity var(--duration-fast) var(--ease-out); }
.pkt-notes-item:hover .pkt-notes-item__del, .pkt-notes-item--on .pkt-notes-item__del { opacity: 1; }
.pkt-notes-editor { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 10px; padding: 14px; }
.pkt-notes-editor__meta { flex: none; display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: var(--text-tertiary); }
.pkt-notes-empty { flex: 1; display: grid; place-items: center; padding: 24px; }
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-notes")) {
  const s = document.createElement("style"); s.id = "pkt-css-notes"; s.textContent = css;
  document.head.appendChild(s);
}

function NotesWindow({ onClose }) {
  const [notes, setNotes] = React.useState(loadNotes);
  const [activeId, setActiveId] = React.useState(() => {
    const n = loadNotes();
    return n.length ? n[0].id : null;
  });

  // Autosave: persist on every change to notes.
  React.useEffect(() => { saveNotes(notes); }, [notes]);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const active = notes.find((n) => n.id === activeId) || null;

  const createNote = () => {
    const note = { id: newId(), text: "", updatedAt: Date.now() };
    setNotes((prev) => [note, ...prev]);
    setActiveId(note.id);
  };

  const updateActive = (text) => {
    setNotes((prev) => prev.map((n) => (n.id === activeId ? { ...n, text, updatedAt: Date.now() } : n)));
  };

  const deleteNote = (id) => {
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== id);
      if (id === activeId) setActiveId(next.length ? next[0].id : null);
      return next;
    });
  };

  // Sort newest-edited first for the list.
  const ordered = [...notes].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  return (
    <div className="pkt-notes-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pkt-notes-win" role="dialog" aria-label="Notes" aria-modal="true">
        <div className="pkt-notes-head">
          <span className="pkt-notes-head__title">
            <span className="pkt-notes-head__icon"><Icon name="notebook-pen" size={14} /></span>
            Notes
          </span>
          <span className="pkt-notes-saved"><Icon name="check" size={13} style={{ color: "var(--text-accent)" }} /> Saved locally</span>
          <span style={{ marginLeft: "auto", display: "inline-flex", gap: 6 }}>
            <Button variant="secondary" size="sm" icon="plus" onClick={createNote}>New note</Button>
            <IconButton icon="x" label="Close" onClick={onClose} />
          </span>
        </div>

        <div className="pkt-notes-body">
          <div className="pkt-notes-list">
            <div className="pkt-notes-list__scroll">
              {ordered.length === 0 ? (
                <div style={{ padding: "16px 10px", fontSize: 12, color: "var(--text-tertiary)" }}>
                  No notes yet. Create one to get started.
                </div>
              ) : ordered.map((n) => (
                <button key={n.id} type="button"
                  className={"pkt-notes-item" + (n.id === activeId ? " pkt-notes-item--on" : "")}
                  onClick={() => setActiveId(n.id)}>
                  <span className="pkt-notes-item__title">{titleOf(n.text)}</span>
                  <span className="pkt-notes-item__sub">{relTime(n.updatedAt)} · {previewOf(n.text)}</span>
                  <span className="pkt-notes-item__del">
                    <IconButton icon="trash-2" label="Delete note" size="sm"
                      onClick={(e) => { e.stopPropagation(); deleteNote(n.id); }} />
                  </span>
                </button>
              ))}
            </div>
          </div>

          {active ? (
            <div className="pkt-notes-editor">
              <div className="pkt-notes-editor__meta">
                <span>{titleOf(active.text)}</span>
                <span>Edited {relTime(active.updatedAt)}</span>
              </div>
              <Textarea mono={false} value={active.text} autoFocus
                onChange={(e) => updateActive(e.target.value)}
                placeholder="Start typing… your note saves automatically."
                style={{ flex: 1, minHeight: 0, resize: "none" }} />
            </div>
          ) : (
            <div className="pkt-notes-empty">
              <EmptyState icon="notebook-pen" title="No note selected"
                hint="Create a note to jot something down. Notes are saved automatically in your browser." />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function NotesButton() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <IconButton icon="notebook-pen" label="Notes" active={open} onClick={() => setOpen(true)} />
      {open ? <NotesWindow onClose={() => setOpen(false)} /> : null}
    </>
  );
}
