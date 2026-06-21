// Pocket — standard 5-field cron parser + describer + next-run finder. Pure JS,
// no DOM. Supports *, */n, a-b, a-b/n, lists, month/weekday names, and @macros.
// next-run search is bounded (steps minute-by-minute up to a day cap) so it can
// never hang. See cron-util.test.js.

// Leading "" so month names are 1-indexed (jan→1); weekdays stay 0-indexed (sun→0).
const MONTHS = ["", "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const DOWS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const MONTH_NAMES = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOW_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const MACROS = {
  "@yearly": "0 0 1 1 *", "@annually": "0 0 1 1 *", "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0", "@daily": "0 0 * * *", "@midnight": "0 0 * * *", "@hourly": "0 * * * *",
};

function nameOrNum(tok, names) {
  const t = tok.trim().toLowerCase();
  if (names) { const i = names.indexOf(t.slice(0, 3)); if (i !== -1) return i; }
  const n = parseInt(t, 10);
  if (!Number.isFinite(n)) throw new Error(`Bad value "${tok}"`);
  return n;
}

function parseField(field, min, max, names) {
  const set = new Set();
  for (let part of field.split(",")) {
    part = part.trim();
    if (!part) throw new Error("Empty field part");
    let step = 1;
    const slash = part.indexOf("/");
    if (slash !== -1) { step = parseInt(part.slice(slash + 1), 10); part = part.slice(0, slash); }
    if (!Number.isFinite(step) || step < 1) throw new Error(`Bad step in "${field}"`);
    let lo, hi;
    if (part === "*") { lo = min; hi = max; }
    else {
      const dash = part.indexOf("-", 1);
      if (dash !== -1) { lo = nameOrNum(part.slice(0, dash), names); hi = nameOrNum(part.slice(dash + 1), names); }
      else { lo = nameOrNum(part, names); hi = slash !== -1 ? max : lo; }
    }
    if (lo < min || hi > max || lo > hi) throw new Error(`Value out of range in "${field}" (${min}–${max})`);
    for (let v = lo; v <= hi; v += step) set.add(v);
  }
  return [...set].sort((a, b) => a - b);
}

export function parseCron(expr) {
  let e = String(expr || "").trim();
  if (!e) throw new Error("Enter a cron expression");
  if (e[0] === "@") {
    const m = MACROS[e.toLowerCase()];
    if (!m) throw new Error(`Unknown macro "${e}"`);
    e = m;
  }
  const tokens = e.split(/\s+/);
  let seconds = null, idx = 0, hasSeconds = false;
  if (tokens.length === 6) { hasSeconds = true; seconds = parseField(tokens[idx++], 0, 59, null); }
  else if (tokens.length !== 5) throw new Error(`Expected 5 fields (got ${tokens.length})`);

  const minutes = parseField(tokens[idx++], 0, 59, null);
  const hours = parseField(tokens[idx++], 0, 23, null);
  const doms = parseField(tokens[idx], 1, 31, null); const domRaw = tokens[idx++];
  const months = parseField(tokens[idx++], 1, 12, MONTHS);
  let dows = parseField(tokens[idx], 0, 7, DOWS); const dowRaw = tokens[idx++];
  dows = [...new Set(dows.map((d) => (d === 7 ? 0 : d)))].sort((a, b) => a - b);

  return {
    seconds, minutes, hours, doms, months, dows, hasSeconds,
    domsFull: domRaw === "*", dowsFull: dowRaw === "*" || dowRaw === "?",
    minutesFull: tokens[hasSeconds ? 1 : 0] === "*", hoursFull: tokens[hasSeconds ? 2 : 1] === "*",
    monthsFull: months.length === 12,
  };
}

function matches(p, d) {
  const minOk = p.minutes.includes(d.getMinutes());
  const hourOk = p.hours.includes(d.getHours());
  const monthOk = p.months.includes(d.getMonth() + 1);
  const domMatch = p.doms.includes(d.getDate());
  const dowMatch = p.dows.includes(d.getDay());
  // Cron quirk: when BOTH day-of-month and day-of-week are restricted, a day
  // matches if EITHER does; otherwise both must match (one being "*").
  const dayOk = (!p.domsFull && !p.dowsFull) ? (domMatch || dowMatch) : (domMatch && dowMatch);
  return minOk && hourOk && monthOk && dayOk;
}

export function nextRuns(p, from, count = 5, capDays = 366) {
  const runs = [];
  const d = new Date(from.getTime());
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() + 1);
  const capMs = from.getTime() + capDays * 86400000;
  while (runs.length < count && d.getTime() <= capMs) {
    if (matches(p, d)) runs.push(new Date(d.getTime()));
    d.setMinutes(d.getMinutes() + 1);
  }
  return runs;
}

// Detect an arithmetic "every N" pattern over a field's full range.
function describeSet(values, full, min, max, kind) {
  if (full || (values.length === (max - min + 1))) return null; // "every"
  if (values.length === 1) return `${kind} ${values[0]}`;
  // even step?
  if (values[0] === min && values.length > 2) {
    const step = values[1] - values[0];
    let arith = step > 0;
    for (let i = 1; i < values.length; i++) if (values[i] - values[i - 1] !== step) { arith = false; break; }
    if (arith && (values[values.length - 1] + step > max)) return `every ${step} ${kind}s`;
  }
  return `${kind}s ${values.join(", ")}`;
}

export function describeCron(p) {
  const parts = [];
  // time of day
  if (p.minutesFull && p.hoursFull) parts.push("Every minute");
  else if (p.minutes.length === 1 && p.minutes[0] === 0 && !p.hoursFull && p.hours.length === 1) {
    parts.push(`At ${pad(p.hours[0])}:00`);
  } else {
    const minD = describeSet(p.minutes, p.minutesFull, 0, 59, "minute");
    const hourD = describeSet(p.hours, p.hoursFull, 0, 23, "hour");
    if (p.minutesFull) parts.push("Every minute");
    else if (p.hoursFull) parts.push(`At ${minD}`);
    else parts.push(`At ${minD || "every minute"}${hourD ? ", " + hourD : ""}`);
  }
  // months
  if (!p.monthsFull) parts.push("in " + p.months.map((m) => MONTH_NAMES[m]).join(", "));
  // days
  if (!p.domsFull && !p.dowsFull) {
    parts.push(`on day-of-month ${p.doms.join(", ")} or ${p.dows.map((d) => DOW_NAMES[d]).join(", ")}`);
  } else {
    if (!p.domsFull) parts.push(`on day-of-month ${p.doms.join(", ")}`);
    if (!p.dowsFull) parts.push(`on ${p.dows.map((d) => DOW_NAMES[d]).join(", ")}`);
  }
  return parts.join(" ") + ".";
}

function pad(n) { return String(n).padStart(2, "0"); }

// Per-field breakdown for the UI table.
export function cronBreakdown(p) {
  const setStr = (vals, full) => (full ? "every" : vals.join(", "));
  const rows = [];
  if (p.hasSeconds) rows.push(["Seconds", setStr(p.seconds, false)]);
  rows.push(["Minute", setStr(p.minutes, p.minutesFull)]);
  rows.push(["Hour", setStr(p.hours, p.hoursFull)]);
  rows.push(["Day of month", setStr(p.doms, p.domsFull)]);
  rows.push(["Month", p.monthsFull ? "every" : p.months.map((m) => MONTH_NAMES[m]).join(", ")]);
  rows.push(["Day of week", p.dowsFull ? "every" : p.dows.map((d) => DOW_NAMES[d]).join(", ")]);
  return rows;
}
