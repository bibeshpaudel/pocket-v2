import { describe, it, expect } from "vitest";
import {
  convertBase, parseBigIntInBase, slugify, parseEnv, objectToEnv,
  escapeHTML, unescapeHTML, escapeJSONString, unescapeJSONString, escapeUnicode, unescapeUnicode,
} from "./text-convert.js";

describe("number base", () => {
  it("converts between bases", () => {
    expect(convertBase("255", 10, 2)).toBe("11111111");
    expect(convertBase("255", 10, 16)).toBe("ff");
    expect(convertBase("ff", 16, 10)).toBe("255");
    expect(convertBase("777", 8, 10)).toBe("511");
    expect(convertBase("z", 36, 10)).toBe("35");
  });
  it("handles prefixes, separators and signs", () => {
    expect(convertBase("0xFF", 16, 10)).toBe("255");
    expect(convertBase("1010_1010", 2, 16)).toBe("aa");
    expect(convertBase("-16", 10, 16)).toBe("-10");
  });
  it("round-trips very large numbers via BigInt", () => {
    const big = "123456789012345678901234567890";
    expect(convertBase(convertBase(big, 10, 16), 16, 10)).toBe(big);
  });
  it("throws on an invalid digit", () => {
    expect(() => parseBigIntInBase("2", 2)).toThrow(/invalid digit/i);
    expect(() => parseBigIntInBase("g", 16)).toThrow(/invalid digit/i);
  });
});

describe("slugify", () => {
  it("strips diacritics and special characters", () => {
    expect(slugify("Crème Brûlée — 10 Best!")).toBe("creme-brulee-10-best");
  });
  it("honours separator and casing options", () => {
    expect(slugify("Hello World", { separator: "_" })).toBe("hello_world");
    expect(slugify("Hello World", { separator: "" })).toBe("helloworld");
    expect(slugify("Hello World", { lower: false })).toBe("Hello-World");
  });
});

describe("env <-> object", () => {
  it("parses comments, export, quotes and inline comments", () => {
    const env = '# c\nexport A=1\nB="x y"\nC=hello # note\nD=\'raw\'';
    expect(parseEnv(env)).toEqual({ A: "1", B: "x y", C: "hello", D: "raw" });
  });
  it("serialises and round-trips", () => {
    expect(objectToEnv({ A: "1", B: "x y" })).toBe('A=1\nB="x y"');
    expect(parseEnv(objectToEnv({ A: "1", B: "x y", C: "" }))).toEqual({ A: "1", B: "x y", C: "" });
  });
});

describe("escaping", () => {
  it("HTML entities round-trip incl. numeric", () => {
    expect(escapeHTML('a<b>&"\'')).toBe("a&lt;b&gt;&amp;&quot;&#39;");
    expect(unescapeHTML("a&lt;b&gt;&amp;&quot;&#39;")).toBe('a<b>&"\'');
    expect(unescapeHTML("&#65;&#x42;")).toBe("AB");
  });
  it("JSON string escapes round-trip", () => {
    const raw = 'a"b\nc\td';
    expect(unescapeJSONString(escapeJSONString(raw))).toBe(raw);
  });
  it("Unicode escapes round-trip", () => {
    expect(escapeUnicode("café")).toBe("caf\\u00e9");
    expect(unescapeUnicode("caf\\u00e9")).toBe("café");
  });
});
