// Pocket — tests for the CSV engine (pure JS, no DOM). Run with `npm test`.
import { describe, it, expect } from "vitest";
import {
  parseCSV, detectDelimiter, resolveDelimiter, csvField, inferValue, runJob,
  PREVIEW_LIMIT,
} from "./csv-shared.js";

describe("parseCSV", () => {
  it("parses simple rows", () => {
    expect(parseCSV("a,b,c\n1,2,3", ",")).toEqual([["a", "b", "c"], ["1", "2", "3"]]);
  });

  it("does not add a trailing empty row for a final newline", () => {
    expect(parseCSV("a,b\n1,2\n", ",")).toEqual([["a", "b"], ["1", "2"]]);
  });

  it("keeps a quoted field containing the delimiter", () => {
    expect(parseCSV('"Smith, Ada",36', ",")).toEqual([["Smith, Ada", "36"]]);
  });

  it("unescapes doubled quotes", () => {
    expect(parseCSV('"he said ""hi"""', ",")).toEqual([['he said "hi"']]);
  });

  it("keeps newlines inside quoted fields", () => {
    expect(parseCSV('a,"line1\nline2"', ",")).toEqual([["a", "line1\nline2"]]);
  });

  it("handles CRLF and lone-CR line endings", () => {
    expect(parseCSV("a,b\r\n1,2\r\n", ",")).toEqual([["a", "b"], ["1", "2"]]);
    expect(parseCSV("a,b\r1,2", ",")).toEqual([["a", "b"], ["1", "2"]]);
  });

  it("supports non-comma delimiters", () => {
    expect(parseCSV("a\tb\t c", "\t")).toEqual([["a", "b", " c"]]);
    expect(parseCSV("a;b;c", ";")).toEqual([["a", "b", "c"]]);
  });

  it("preserves a trailing empty field", () => {
    expect(parseCSV("a,b,", ",")).toEqual([["a", "b", ""]]);
  });

  it("returns no rows for empty input", () => {
    expect(parseCSV("", ",")).toEqual([]);
  });
});

describe("detectDelimiter", () => {
  it("picks the dominant delimiter on the header line", () => {
    expect(detectDelimiter("a,b,c\n1,2,3")).toBe(",");
    expect(detectDelimiter("a;b;c\n1;2;3")).toBe(";");
    expect(detectDelimiter("a\tb\tc")).toBe("\t");
    expect(detectDelimiter("a|b|c")).toBe("|");
  });
  it("defaults to comma when nothing matches", () => {
    expect(detectDelimiter("single")).toBe(",");
    expect(resolveDelimiter("auto", "x|y")).toBe("|");
    expect(resolveDelimiter(",", "x|y")).toBe(",");
  });
});

describe("csvField", () => {
  it("leaves plain values unquoted", () => {
    expect(csvField("hello", ",")).toBe("hello");
  });
  it("quotes and escapes when needed", () => {
    expect(csvField("a,b", ",")).toBe('"a,b"');
    expect(csvField('say "hi"', ",")).toBe('"say ""hi"""');
    expect(csvField("line1\nline2", ",")).toBe('"line1\nline2"');
  });
});

describe("inferValue", () => {
  it("coerces numbers and booleans", () => {
    expect(inferValue("42")).toBe(42);
    expect(inferValue("-3.14")).toBe(-3.14);
    expect(inferValue("1e3")).toBe(1000);
    expect(inferValue("true")).toBe(true);
    expect(inferValue("false")).toBe(false);
  });
  it("keeps leading-zero ids and oversized ints as strings", () => {
    expect(inferValue("007")).toBe("007");
    expect(inferValue("12345678901234567890")).toBe("12345678901234567890");
  });
  it("maps empty to null and leaves text alone", () => {
    expect(inferValue("")).toBe(null);
    expect(inferValue("hello")).toBe("hello");
  });
});

describe("csvToJson", () => {
  const csv = "name,age,active\nAda,36,true\nGrace,40,false";

  it("produces typed objects (pretty)", () => {
    const r = runJob("csvToJson", { text: csv, hasHeader: true, typed: true, shape: "objects", pretty: true });
    expect(JSON.parse(r.output)).toEqual([
      { name: "Ada", age: 36, active: true },
      { name: "Grace", age: 40, active: false },
    ]);
    expect(r.rowCount).toBe(2);
  });

  it("can keep everything as strings", () => {
    const r = runJob("csvToJson", { text: csv, hasHeader: true, typed: false, shape: "objects", pretty: false });
    expect(JSON.parse(r.output)[0]).toEqual({ name: "Ada", age: "36", active: "true" });
  });

  it("supports the arrays shape", () => {
    const r = runJob("csvToJson", { text: csv, hasHeader: true, typed: true, shape: "arrays", pretty: false });
    expect(JSON.parse(r.output)).toEqual([["Ada", 36, true], ["Grace", 40, false]]);
  });

  it("synthesises field_N headers when there is no header row", () => {
    const r = runJob("csvToJson", { text: "1,2\n3,4", hasHeader: false, typed: true, shape: "objects", pretty: false });
    expect(JSON.parse(r.output)).toEqual([{ field_1: 1, field_2: 2 }, { field_1: 3, field_2: 4 }]);
  });
});

describe("csvToSql", () => {
  const csv = "id,name\n1,O'Brien\n2,Ada";

  it("emits multi-row INSERTs with MySQL quoting + escaping", () => {
    const r = runJob("csvToSql", { text: csv, hasHeader: true, typed: true, dialect: "mysql", table: "people", createTable: false, multiRow: true, batchSize: 500 });
    expect(r.output).toContain("INSERT INTO `people` (`id`, `name`) VALUES");
    expect(r.output).toContain("(1, 'O''Brien')");
    expect(r.output).toContain("(2, 'Ada')");
  });

  it("batches multi-row INSERTs by batchSize", () => {
    const big = "n\n" + Array.from({ length: 5 }, (_, i) => i).join("\n");
    const r = runJob("csvToSql", { text: big, hasHeader: true, typed: true, dialect: "mysql", table: "t", createTable: false, multiRow: true, batchSize: 2 });
    expect((r.output.match(/INSERT INTO/g) || []).length).toBe(3); // 2 + 2 + 1
  });

  it("emits one statement per row when multiRow is off", () => {
    const r = runJob("csvToSql", { text: csv, hasHeader: true, typed: true, dialect: "postgresql", table: "p", createTable: false, multiRow: false });
    expect((r.output.match(/INSERT INTO/g) || []).length).toBe(2);
    expect(r.output).toContain('INSERT INTO "p" ("id", "name")');
  });

  it("infers CREATE TABLE column types consistently with values", () => {
    const r = runJob("csvToSql", { text: "id,zip\n1,007\n2,008", hasHeader: true, typed: true, dialect: "mysql", table: "t", createTable: true, multiRow: true });
    expect(r.output).toContain("`id` INT");
    expect(r.output).toContain("`zip` TEXT"); // leading zeros stay text, matching '007'
    expect(r.output).toContain("'007'"); // the value is emitted as a quoted string
  });

  it("renders booleans per dialect", () => {
    const csvB = "flag\ntrue\nfalse";
    expect(runJob("csvToSql", { text: csvB, hasHeader: true, typed: true, dialect: "postgresql", table: "t", multiRow: false }).output).toContain("(TRUE)");
    expect(runJob("csvToSql", { text: csvB, hasHeader: true, typed: true, dialect: "sqlite", table: "t", multiRow: false }).output).toContain("(1)");
  });
});

describe("jsonToCsv", () => {
  it("converts an array of objects with a union of keys", () => {
    const r = runJob("jsonToCsv", { text: JSON.stringify([{ a: 1, b: 2 }, { a: 3, c: 4 }]), delimiter: "," });
    expect(r.output).toBe("a,b,c\n1,2,\n3,,4");
  });
  it("converts an array of arrays", () => {
    const r = runJob("jsonToCsv", { text: JSON.stringify([[1, 2], [3, 4]]), delimiter: "," });
    expect(r.output).toBe("1,2\n3,4");
  });
  it("stringifies nested values into a cell", () => {
    const r = runJob("jsonToCsv", { text: JSON.stringify([{ a: { x: 1 } }]), delimiter: "," });
    expect(r.output).toBe('a\n"{""x"":1}"');
  });
  it("throws a clear error on invalid JSON", () => {
    expect(() => runJob("jsonToCsv", { text: "{not json", delimiter: "," })).toThrow(/not valid JSON/i);
  });
});

describe("parseEditor", () => {
  it("splits the header row and rectangularises the body", () => {
    // A short header + a wider data row widens the grid (data is never dropped):
    // headers pad to the max column count, every row normalises to that width.
    const r = runJob("parseEditor", { text: "a,b,c\n1,2\n3,4,5,6", hasHeader: true, maxRows: 100 });
    expect(r.headers).toEqual(["a", "b", "c", "Column 4"]);
    expect(r.rows).toEqual([["1", "2", "", ""], ["3", "4", "5", "6"]]);
    expect(r.total).toBe(2);
    expect(r.capped).toBe(false);
  });

  it("pads short rows and trims long ones to the header width", () => {
    const r = runJob("parseEditor", { text: "a,b,c\n1,2\n3,4,5", hasHeader: true, maxRows: 100 });
    expect(r.headers).toEqual(["a", "b", "c"]);
    expect(r.rows).toEqual([["1", "2", ""], ["3", "4", "5"]]);
  });

  it("synthesises Column N headers without a header row", () => {
    const r = runJob("parseEditor", { text: "1,2\n3,4", hasHeader: false, maxRows: 100 });
    expect(r.headers).toEqual(["Column 1", "Column 2"]);
    expect(r.rows.length).toBe(2);
  });

  it("caps the materialised rows at maxRows", () => {
    const text = "h\n" + Array.from({ length: 50 }, (_, i) => i).join("\n");
    const r = runJob("parseEditor", { text, hasHeader: true, maxRows: 10 });
    expect(r.total).toBe(50);
    expect(r.capped).toBe(true);
    expect(r.rows.length).toBe(10);
  });
});

describe("editorToCsv", () => {
  it("round-trips with quoting and an optional header", () => {
    const headers = ["a", "b"];
    const rows = [["1", "x,y"], ["2", "z"]];
    expect(runJob("editorToCsv", { headers, rows, delimiter: ",", includeHeader: true }).output)
      .toBe('a,b\n1,"x,y"\n2,z');
    expect(runJob("editorToCsv", { headers, rows, delimiter: ",", includeHeader: false }).output)
      .toBe('1,"x,y"\n2,z');
  });
});

describe("preview capping", () => {
  it("truncates the on-screen preview but keeps the full output", () => {
    const rows = Array.from({ length: 20000 }, (_, i) => `${i},some-longer-value-${i}`).join("\n");
    const r = runJob("csvToJson", { text: "a,b\n" + rows, hasHeader: true, typed: true, shape: "objects", pretty: true });
    expect(r.output.length).toBeGreaterThan(PREVIEW_LIMIT);
    expect(r.truncated).toBe(true);
    expect(r.preview.length).toBe(PREVIEW_LIMIT);
  });
});
