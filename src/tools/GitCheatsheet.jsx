// Pocket — Git Cheatsheet. A full, interactive reference + flashcard trainer for git.
// Browse: searchable, category-filtered command catalog. Practice: reveal-the-command
// flashcards with mastery persisted to localStorage. Built from DS primitives + tokens.
import React from "react";
import { Panel } from "../../Pocket Design System/components/surfaces/Panel.jsx";
import { Badge } from "../../Pocket Design System/components/core/Badge.jsx";
import { Button } from "../../Pocket Design System/components/core/Button.jsx";
import { CopyButton } from "../../Pocket Design System/components/core/CopyButton.jsx";
import { IconButton } from "../../Pocket Design System/components/core/IconButton.jsx";
import { Icon } from "../../Pocket Design System/components/core/Icon.jsx";
import { Input } from "../../Pocket Design System/components/forms/Input.jsx";
import { Select } from "../../Pocket Design System/components/forms/Select.jsx";
import { Switch } from "../../Pocket Design System/components/forms/Switch.jsx";
import { SegmentedControl } from "../../Pocket Design System/components/forms/SegmentedControl.jsx";
import { EmptyState } from "../../Pocket Design System/components/surfaces/EmptyState.jsx";
import { GIT_CATEGORIES, GIT_COMMANDS, GIT_COMMAND_COUNT } from "./git-commands.js";

const css = `
.pkt-git-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 24px; }
.pkt-git-secthead { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; color: var(--text-tertiary); }
.pkt-git-secthead b { font-size: 12px; font-weight: var(--weight-semibold); letter-spacing: var(--tracking-caps); text-transform: uppercase; color: var(--text-secondary); }
.pkt-git-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 10px; }
.pkt-git-card {
  display: flex; flex-direction: column; gap: 7px; padding: 12px 14px;
  background: var(--surface-raised); border: 1px solid var(--border-default); border-radius: var(--radius-md);
  transition: border-color var(--duration-fast) var(--ease-out);
}
.pkt-git-card:hover { border-color: var(--border-strong); }
.pkt-git-cmdrow { display: flex; align-items: center; gap: 8px; }
.pkt-git-cmd { flex: 1; min-width: 0; font-family: var(--font-mono); font-size: var(--text-sm); color: var(--text-primary); overflow-x: auto; white-space: nowrap; padding-bottom: 1px; }
.pkt-git-desc { font-size: var(--text-sm); color: var(--text-secondary); line-height: var(--leading-snug); }
.pkt-git-example { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-tertiary); }
.pkt-git-card-tags { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.pkt-git-blurb { font-size: var(--text-sm); color: var(--text-tertiary); margin: -4px 0 12px; line-height: var(--leading-snug); max-width: 70ch; }
.pkt-git-note { display: flex; align-items: flex-start; gap: 6px; font-size: var(--text-xs); color: var(--text-tertiary); line-height: var(--leading-snug); }
.pkt-git-note svg { margin-top: 1px; flex: none; }
.pkt-git-note--warn { color: var(--warn); }

.pkt-git-flashwrap { flex: 1; min-height: 0; display: grid; place-items: center; padding: 16px; }
.pkt-git-flash { width: 100%; max-width: 640px; display: flex; flex-direction: column; gap: 16px; }
.pkt-git-flashcard {
  background: var(--surface-raised); border: 1px solid var(--border-default); border-radius: var(--radius-lg);
  box-shadow: var(--shadow-1); padding: 24px; display: flex; flex-direction: column; gap: 18px; min-height: 220px;
}
.pkt-git-tasklabel { font-size: 11px; font-weight: var(--weight-semibold); letter-spacing: var(--tracking-caps); text-transform: uppercase; color: var(--text-tertiary); }
.pkt-git-task { font-size: var(--text-lg); font-weight: var(--weight-medium); color: var(--text-primary); line-height: var(--leading-snug); }
.pkt-git-answer { background: var(--code-bg); border-radius: var(--radius-md); padding: 14px 16px; display: flex; align-items: center; gap: 10px; }
.pkt-git-answer code { flex: 1; min-width: 0; font-family: var(--font-mono); font-size: var(--text-md); color: var(--code-fg); overflow-x: auto; white-space: nowrap; }
.pkt-git-answer-example { margin-top: 8px; font-family: var(--font-mono); font-size: var(--text-xs); color: var(--syn-comment); }
.pkt-git-flashnav { display: flex; align-items: center; justify-content: center; gap: 12px; color: var(--text-tertiary); font-size: var(--text-sm); }
.pkt-git-hint { font-size: var(--text-xs); color: var(--text-tertiary); text-align: center; }
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-git")) {
  const s = document.createElement("style"); s.id = "pkt-css-git"; s.textContent = css;
  document.head.appendChild(s);
}

const MASTERED_KEY = "pocket-git-mastered";
function loadMastered() {
  try { return new Set(JSON.parse(localStorage.getItem(MASTERED_KEY)) || []); }
  catch (e) { return new Set(); }
}

// Render a command with placeholders dimmed and the leading "git" tinted.
function CmdText({ cmd }) {
  const lead = cmd.startsWith("git ") ? "git " : "";
  const rest = lead ? cmd.slice(lead.length) : cmd;
  const parts = rest.split(/(<[^>]+>)/g);
  return (
    <>
      {lead ? <span style={{ color: "var(--amber-700)" }}>{lead}</span> : null}
      {parts.map((p, i) =>
        /^<[^>]+>$/.test(p)
          ? <span key={i} style={{ color: "var(--syn-comment)", fontStyle: "italic" }}>{p}</span>
          : <React.Fragment key={i}>{p}</React.Fragment>
      )}
    </>
  );
}

const CATEGORY_OPTIONS = [{ value: "All", label: "All categories" }]
  .concat(GIT_CATEGORIES.map((c) => ({ value: c.id, label: c.id })));

function shuffleIndices(n) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function GitCheatsheetScreen() {
  const [mode, setMode] = React.useState("Browse");
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("All");
  const [mastered, setMastered] = React.useState(loadMastered);

  React.useEffect(() => {
    try { localStorage.setItem(MASTERED_KEY, JSON.stringify([...mastered])); } catch (e) { /* no-op */ }
  }, [mastered]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <SegmentedControl options={["Browse", "Practice"]} value={mode} onChange={setMode} />
        <Select options={CATEGORY_OPTIONS} value={category} onChange={(e) => setCategory(e.target.value)} />
        {mode === "Browse" ? (
          <Input placeholder="Search commands…" value={query}
            onChange={(e) => setQuery(e.target.value)} style={{ width: 240 }} />
        ) : null}
      </div>

      {mode === "Browse"
        ? <BrowseView query={query} category={category} mastered={mastered} />
        : <PracticeView category={category} mastered={mastered} setMastered={setMastered} />}
    </div>
  );
}

function BrowseView({ query, category, mastered }) {
  const q = query.trim().toLowerCase();
  const groups = React.useMemo(() => {
    return GIT_CATEGORIES
      .filter((cat) => category === "All" || cat.id === category)
      .map((cat) => ({
        ...cat,
        list: cat.commands.filter((c) =>
          !q || (c.cmd + " " + c.desc).toLowerCase().includes(q)),
      }))
      .filter((cat) => cat.list.length);
  }, [q, category]);

  const shown = groups.reduce((n, g) => n + g.list.length, 0);

  return (
    <Panel variant="sunken" title="Git commands"
      meta={`${shown} of ${GIT_COMMAND_COUNT}`}>
      {shown === 0 ? (
        <div style={{ display: "grid", placeItems: "center", flex: 1 }}>
          <EmptyState icon="search-x" title="No commands match" hint={`Nothing for “${query}”. Try a different word.`} />
        </div>
      ) : (
        <div className="pkt-git-scroll">
          {groups.map((g) => (
            <section key={g.id}>
              <div className="pkt-git-secthead">
                <Icon name={g.icon} size={15} />
                <b>{g.id}</b>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{g.list.length}</span>
              </div>
              {g.blurb ? <div className="pkt-git-blurb">{g.blurb}</div> : null}
              <div className="pkt-git-grid">
                {g.list.map((c) => (
                  <div key={c.cmd} className="pkt-git-card">
                    <div className="pkt-git-cmdrow">
                      <code className="pkt-git-cmd"><CmdText cmd={c.cmd} /></code>
                      {c.danger ? <Badge kind="danger" dot>Caution</Badge> : null}
                      {mastered.has(c.cmd) ? <Badge kind="ok" dot>Known</Badge> : null}
                      <CopyButton getText={() => c.cmd} label="Copy" />
                    </div>
                    <div className="pkt-git-desc">{c.desc}</div>
                    {c.example ? <code className="pkt-git-example">e.g. {c.example}</code> : null}
                    {c.note ? (
                      <div className={"pkt-git-note" + (c.danger ? " pkt-git-note--warn" : "")}>
                        <Icon name={c.danger ? "triangle-alert" : "lightbulb"} size={13} />
                        <span>{c.note}</span>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </Panel>
  );
}

function PracticeView({ category, mastered, setMastered }) {
  const [skipMastered, setSkipMastered] = React.useState(false);
  const [order, setOrder] = React.useState([]);
  const [pos, setPos] = React.useState(0);
  const [revealed, setRevealed] = React.useState(false);

  const pool = React.useMemo(
    () => GIT_COMMANDS.filter((c) => category === "All" || c.category === category),
    [category]
  );

  const restart = React.useCallback(() => {
    setOrder(shuffleIndices(pool.length));
    setPos(0);
    setRevealed(false);
  }, [pool.length]);

  // New shuffle whenever the pool (category) changes.
  React.useEffect(() => { restart(); }, [restart]);

  const masteredInPool = pool.reduce((n, c) => n + (mastered.has(c.cmd) ? 1 : 0), 0);
  const current = pos < order.length ? pool[order[pos]] : null;
  const finished = order.length > 0 && pos >= order.length;

  const addMastered = (cmd) => setMastered((m) => { const n = new Set(m); n.add(cmd); return n; });
  const resetMastery = () => setMastered((m) => {
    const n = new Set(m); pool.forEach((c) => n.delete(c.cmd)); return n;
  });

  const advance = React.useCallback((markKnown) => {
    if (current && markKnown) addMastered(current.cmd);
    let next = pos + 1;
    if (skipMastered) {
      while (next < order.length && mastered.has(pool[order[next]].cmd)) next++;
    }
    setPos(next);
    setRevealed(false);
  }, [current, pos, order, skipMastered, mastered, pool]);

  const prev = () => { if (pos > 0) { setPos(pos - 1); setRevealed(false); } };

  // Keyboard: Space/Enter reveal→advance, arrows navigate, K = known.
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (!current) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!revealed) setRevealed(true); else advance(false);
      } else if (e.key === "ArrowRight") { e.preventDefault(); advance(false); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      else if (e.key.toLowerCase() === "k") { e.preventDefault(); advance(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, revealed, advance]);

  return (
    <Panel variant="sunken" title="Practice"
      meta={`${masteredInPool} / ${pool.length} mastered`}
      actions={
        <span style={{ display: "flex", gap: 6 }}>
          <Button variant="ghost" size="sm" icon="shuffle" onClick={restart}>Shuffle</Button>
          <Button variant="ghost" size="sm" icon="eraser" onClick={resetMastery}>Reset</Button>
        </span>
      }>
      {pool.length === 0 ? (
        <div style={{ display: "grid", placeItems: "center", flex: 1 }}>
          <EmptyState icon="inbox" title="No cards here" hint="Pick a different category to practice." />
        </div>
      ) : finished ? (
        <div style={{ display: "grid", placeItems: "center", flex: 1 }}>
          <EmptyState icon="party-popper" title={`Reviewed all ${order.length} cards`}
            hint={`You've mastered ${masteredInPool} of ${pool.length}. Shuffle to go again.`} />
        </div>
      ) : current ? (
        <div className="pkt-git-flashwrap">
          <div className="pkt-git-flash">
            <div className="pkt-git-flashcard">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="pkt-git-tasklabel">Task</span>
                <Badge kind="neutral">{current.category}</Badge>
                {current.danger ? <Badge kind="danger" dot>Caution</Badge> : null}
                {mastered.has(current.cmd) ? <Badge kind="ok" dot>Known</Badge> : null}
              </div>
              <div className="pkt-git-task">{current.desc}</div>

              {!revealed ? (
                <div style={{ marginTop: "auto" }}>
                  <Button variant="primary" size="md" icon="eye" onClick={() => setRevealed(true)}>
                    Reveal command
                  </Button>
                  <div className="pkt-git-hint" style={{ marginTop: 8, textAlign: "left" }}>
                    Press <strong>Space</strong> to reveal · <strong>K</strong> if you knew it · <strong>←/→</strong> to move
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <div className="pkt-git-answer">
                      <code><CmdText cmd={current.cmd} /></code>
                      <CopyButton onDark getText={() => current.cmd} label="Copy" />
                    </div>
                    {current.example ? <div className="pkt-git-answer-example">e.g. {current.example}</div> : null}
                    {current.note ? (
                      <div className={"pkt-git-note" + (current.danger ? " pkt-git-note--warn" : "")} style={{ marginTop: 10 }}>
                        <Icon name={current.danger ? "triangle-alert" : "lightbulb"} size={13} />
                        <span>{current.note}</span>
                      </div>
                    ) : null}
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <Button variant="secondary" size="md" icon="rotate-ccw" onClick={() => advance(false)}>
                      Review again
                    </Button>
                    <span style={{ marginLeft: "auto" }}>
                      <Button variant="primary" size="md" icon="check" onClick={() => advance(true)}>
                        I knew it
                      </Button>
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="pkt-git-flashnav">
              <IconButton icon="chevron-left" label="Previous card" size="sm" onClick={prev} disabled={pos === 0} />
              <span style={{ fontFamily: "var(--font-mono)" }}>{pos + 1} / {order.length}</span>
              <IconButton icon="chevron-right" label="Next card" size="sm" onClick={() => advance(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </Panel>
  );
}
