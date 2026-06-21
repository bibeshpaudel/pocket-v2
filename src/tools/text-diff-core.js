// Pocket — Text Diff engine. Dependency-free, two-level LCS diff:
//   1. line-level alignment (with normalization options)
//   2. word/char-level highlighting WITHIN changed line pairs (the "not generic" part)
// Consumed by TextDiff.jsx.

const LINE_PRODUCT_CAP = 4_000_000;   // guard line-diff memory (n*m)
const INLINE_PRODUCT_CAP = 1_000_000; // guard intra-line char/word diff

// Tokenize a line for intra-line diffing.
export function tokenize(line, gran) {
  if (gran === "char") return Array.from(line);
  return line.match(/(\s+|[A-Za-z0-9_]+|[^\sA-Za-z0-9_]+)/g) || [];
}

// Classic DP LCS, returns ordered ops: {t:"eq"|"del"|"add", a?, b?} over token indices.
function lcsOps(a, b, eq) {
  const n = a.length, m = b.length;
  const dp = [];
  for (let i = 0; i <= n; i++) dp.push(new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = eq(a[i], b[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ops = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (eq(a[i], b[j])) { ops.push({ t: "eq", a: i, b: j }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push({ t: "del", a: i }); i++; }
    else { ops.push({ t: "add", b: j }); j++; }
  }
  while (i < n) { ops.push({ t: "del", a: i }); i++; }
  while (j < m) { ops.push({ t: "add", b: j }); j++; }
  return ops;
}

// Intra-line diff → { left:[{t,s}], right:[{t,s}], sim } where t is eq|del / eq|add.
export function diffInline(aLine, bLine, gran) {
  const at = tokenize(aLine, gran), bt = tokenize(bLine, gran);
  if (at.length * bt.length > INLINE_PRODUCT_CAP) {
    return { left: [{ t: "del", s: aLine }], right: [{ t: "add", s: bLine }], sim: 0 };
  }
  const ops = lcsOps(at, bt, (x, y) => x === y);
  const left = [], right = [];
  let common = 0, alen = 0, blen = 0;
  for (const op of ops) {
    if (op.t === "eq") {
      left.push({ t: "eq", s: at[op.a] }); right.push({ t: "eq", s: bt[op.b] });
      common += at[op.a].length; alen += at[op.a].length; blen += bt[op.b].length;
    } else if (op.t === "del") { left.push({ t: "del", s: at[op.a] }); alen += at[op.a].length; }
    else { right.push({ t: "add", s: bt[op.b] }); blen += bt[op.b].length; }
  }
  const sim = (alen + blen) === 0 ? 1 : (2 * common) / (alen + blen);
  return { left, right, sim };
}

// Main: align two texts into display rows + stats.
// row.type: "eq" | "add" | "del" | "mod"
//   eq  → { leftNo, rightNo, text }
//   del → { leftNo, left }            (whole line removed)
//   add → { rightNo, right }          (whole line added)
//   mod → { leftNo, rightNo, left:[segs], right:[segs] }  (changed line, word-highlighted)
export function diffText(aText, bText, opts) {
  const aLines = aText.split("\n");
  const bLines = bText.split("\n");
  if (aLines.length * bLines.length > LINE_PRODUCT_CAP) return { tooLarge: true };

  const norm = (s) => {
    let x = s;
    if (opts.ignoreWhitespace) x = x.replace(/\s+/g, " ").trim();
    if (opts.ignoreCase) x = x.toLowerCase();
    return x;
  };
  const aN = aLines.map(norm), bN = bLines.map(norm);
  const ops = lcsOps(aN, bN, (x, y) => x === y);

  const rows = [];
  let delBuf = [], addBuf = [];
  const flush = () => {
    const k = Math.min(delBuf.length, addBuf.length);
    for (let p = 0; p < k; p++) {
      const a = delBuf[p], b = addBuf[p];
      const inl = diffInline(aLines[a], bLines[b], opts.gran);
      if (inl.sim >= 0.35) {
        rows.push({ type: "mod", leftNo: a + 1, rightNo: b + 1, left: inl.left, right: inl.right });
      } else {
        rows.push({ type: "del", leftNo: a + 1, left: aLines[a] });
        rows.push({ type: "add", rightNo: b + 1, right: bLines[b] });
      }
    }
    for (let p = k; p < delBuf.length; p++) { const a = delBuf[p]; rows.push({ type: "del", leftNo: a + 1, left: aLines[a] }); }
    for (let p = k; p < addBuf.length; p++) { const b = addBuf[p]; rows.push({ type: "add", rightNo: b + 1, right: bLines[b] }); }
    delBuf = []; addBuf = [];
  };

  for (const op of ops) {
    if (op.t === "eq") { flush(); rows.push({ type: "eq", leftNo: op.a + 1, rightNo: op.b + 1, text: aLines[op.a] }); }
    else if (op.t === "del") delBuf.push(op.a);
    else addBuf.push(op.b);
  }
  flush();

  let added = 0, removed = 0, changed = 0;
  for (const r of rows) {
    if (r.type === "add") added++;
    else if (r.type === "del") removed++;
    else if (r.type === "mod") changed++;
  }
  const eqLines = rows.filter((r) => r.type === "eq").length;
  const denom = eqLines + added + removed + changed;
  const similarity = denom === 0 ? 100 : Math.round((eqLines / denom) * 100);

  return {
    rows,
    stats: { added, removed, changed, similarity, identical: added === 0 && removed === 0 && changed === 0 },
  };
}

// Reconstruct a unified-diff-style text for copying.
export function toUnified(rows) {
  const seg = (arr) => arr.map((x) => x.s).join("");
  const out = [];
  for (const r of rows) {
    if (r.type === "eq") out.push("  " + r.text);
    else if (r.type === "del") out.push("- " + r.left);
    else if (r.type === "add") out.push("+ " + r.right);
    else if (r.type === "mod") { out.push("- " + seg(r.left)); out.push("+ " + seg(r.right)); }
  }
  return out.join("\n");
}
