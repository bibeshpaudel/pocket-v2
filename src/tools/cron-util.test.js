import { describe, it, expect } from "vitest";
import { parseCron, describeCron, nextRuns, cronBreakdown } from "./cron-util.js";

describe("parseCron", () => {
  it("parses fields, ranges, steps and lists", () => {
    const p = parseCron("*/15 9-17 * * 1-5");
    expect(p.minutes).toEqual([0, 15, 30, 45]);
    expect(p.hours).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17]);
    expect(p.dows).toEqual([1, 2, 3, 4, 5]);
    expect(p.domsFull).toBe(true);
  });
  it("supports month/weekday names and 7=Sunday", () => {
    expect(parseCron("0 0 * jan-mar mon").months).toEqual([1, 2, 3]);
    expect(parseCron("0 0 * * 7").dows).toEqual([0]);
  });
  it("expands @macros", () => {
    const p = parseCron("@daily");
    expect(p.minutes).toEqual([0]);
    expect(p.hours).toEqual([0]);
  });
  it("rejects bad expressions", () => {
    expect(() => parseCron("* * *")).toThrow(/5 fields/i);
    expect(() => parseCron("99 * * * *")).toThrow(/range/i);
    expect(() => parseCron("@nope")).toThrow(/macro/i);
  });
});

describe("nextRuns", () => {
  const from = new Date(2026, 0, 1, 0, 0, 0); // local

  it("finds the upcoming matching minutes", () => {
    const runs = nextRuns(parseCron("*/15 * * * *"), from, 3);
    expect(runs.map((d) => d.getMinutes())).toEqual([15, 30, 45]);
  });
  it("respects weekday + hour constraints", () => {
    const runs = nextRuns(parseCron("0 9 * * 1-5"), from, 5);
    expect(runs.length).toBe(5);
    for (const d of runs) {
      expect(d.getHours()).toBe(9);
      expect(d.getMinutes()).toBe(0);
      expect(d.getDay()).toBeGreaterThanOrEqual(1);
      expect(d.getDay()).toBeLessThanOrEqual(5);
    }
  });
  it("returns nothing for an impossible schedule within the cap", () => {
    // Feb 30th never exists.
    expect(nextRuns(parseCron("0 0 30 2 *"), from, 3, 366)).toEqual([]);
  });
});

describe("describe + breakdown", () => {
  it("produces a readable summary", () => {
    expect(describeCron(parseCron("* * * * *"))).toMatch(/every minute/i);
    expect(describeCron(parseCron("0 9 * * *"))).toMatch(/09:00/);
  });
  it("lists fields", () => {
    const rows = cronBreakdown(parseCron("*/15 * * * *"));
    expect(rows.find((r) => r[0] === "Minute")[1]).toBe("0, 15, 30, 45");
    expect(rows.find((r) => r[0] === "Hour")[1]).toBe("every");
  });
});
