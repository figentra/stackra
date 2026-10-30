/**
 * Stackra file contract:
 * Purpose: proves `parseGridValue` on every cell type's edges: empty text (false for a boolean, null otherwise),
 *          numbers with Arabic, Persian and grouped digits, the yes/no words in English and Arabic, options by id or
 *          label, real days only (an impossible month or day returns the text instead of throwing), and plain text.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid); ADR 0022 (test placement); STA-1371.
 */
import type { DataGridColumn } from "#contracts/types/data-grid-column.type";
import { parseGridValue } from "#core/functions/parse-grid-value.function";

const column = (type?: DataGridColumn["type"]): DataGridColumn => ({
  id: "c",
  label: "C",
  ...(type ? { type } : {}),
});
const SELECT: DataGridColumn = {
  id: "size",
  label: "Size",
  type: "select",
  options: [
    { id: "s", label: "Small" },
    { id: "L", label: "Large" },
  ],
};

describe("parseGridValue", () => {
  it.each([
    ["", "boolean", false],
    ["   ", "number", null],
    ["", undefined, null],
  ] as const)("reads empty text %j in a %s column as %j", (text, type, expected) => {
    expect(parseGridValue(text, column(type))).toBe(expected);
  });

  it.each([
    ["42", 42],
    [" 1 200 ", 1200],
    ["١٢٫٥", 12.5],
    ["۳۴", 34],
    ["-7", -7],
    ["Infinity", "Infinity"],
    ["12abc", "12abc"],
    [",", ","],
  ] as const)("parses %j in a number column as %j", (text, expected) => {
    expect(parseGridValue(text, column("number"))).toBe(expected);
  });

  it.each([
    ["Yes", true],
    ["✓", true],
    ["نعم", true],
    ["N", false],
    ["0", false],
    ["لا", false],
    ["maybe", "maybe"],
  ] as const)("parses %j in a boolean column as %j", (text, expected) => {
    expect(parseGridValue(text, column("boolean"))).toBe(expected);
  });

  it("matches an option by id or label, any case, and keeps unknown text", () => {
    expect(parseGridValue("l", SELECT)).toBe("L");
    expect(parseGridValue("SMALL", SELECT)).toBe("s");
    expect(parseGridValue("medium", SELECT)).toBe("medium");
    expect(parseGridValue("s", { id: "x", label: "X", type: "select" })).toBe("s");
  });

  it.each([
    ["2026-4-3", "2026-04-03"],
    ["٢٠٢٦/١٢/٠١", "2026-12-01"],
    ["2026-02-30", "2026-02-30"],
    ["2026/13/01", "2026/13/01"],
    ["2026-04-00", "2026-04-00"],
    ["03/04/2026", "03/04/2026"],
  ] as const)("parses %j in a date column as %j, never throwing", (text, expected) => {
    expect(parseGridValue(text, column("date"))).toBe(expected);
  });

  it("keeps a text cell's text untrimmed", () => {
    expect(parseGridValue(" note ", column())).toBe(" note ");
    expect(parseGridValue(" note ", column("text"))).toBe(" note ");
  });
});
