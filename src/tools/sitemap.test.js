import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { POCKET_TOOLS } from "../tools-data.js";

const SITE = "https://usepocket.vercel.app";
const sitemap = readFileSync(
  fileURLToPath(new URL("../../public/sitemap.xml", import.meta.url)),
  "utf8"
);
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

// The sitemap is hand-maintained; these guard against it silently drifting
// out of sync with POCKET_TOOLS when a tool is added or renamed.
describe("sitemap.xml", () => {
  it("lists the home page", () => {
    expect(locs).toContain(SITE + "/");
  });

  it("lists every tool in the catalog", () => {
    const missing = POCKET_TOOLS.map((t) => t.id).filter(
      (id) => !locs.includes(`${SITE}/tool/${id}`)
    );
    expect(missing).toEqual([]);
  });

  it("lists no tool that is not in the catalog", () => {
    const ids = new Set(POCKET_TOOLS.map((t) => t.id));
    const stale = locs
      .filter((l) => l.includes("/tool/"))
      .map((l) => l.split("/tool/")[1])
      .filter((id) => !ids.has(id));
    expect(stale).toEqual([]);
  });

  it("has no duplicate entries", () => {
    expect(locs.length).toBe(new Set(locs).size);
  });
});
