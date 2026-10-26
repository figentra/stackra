/**
 * Stackra file contract:
 * Purpose: unit tests of `cellText`: empty, primitive, date, rich text, formula result, hyperlink and error values.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0367 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";
import type { CellValue } from "exceljs";

import { cellText } from "#node/functions/cell-text.function";

describe("cellText", () => {
  it("reads every value kind as text", () => {
    expect(cellText(null)).toBe("");
    expect(cellText(undefined)).toBe("");
    expect(cellText(5)).toBe("5");
    expect(cellText(true)).toBe("true");
    expect(cellText(new Date("2026-10-25T00:00:00.000Z"))).toBe("2026-10-25T00:00:00.000Z");
    expect(cellText({ richText: [{ text: "مر" }, { text: "حبا" }] })).toBe("مرحبا");
    expect(cellText({ formula: "A1*2", result: 4 } as CellValue)).toBe("4");
    expect(cellText({ formula: "A1*2" } as CellValue)).toBe("");
    expect(cellText({ text: "site", hyperlink: "https://example.com" })).toBe("site");
    expect(cellText({ error: "#DIV/0!" } as CellValue)).toBe("#DIV/0!");
  });
});
