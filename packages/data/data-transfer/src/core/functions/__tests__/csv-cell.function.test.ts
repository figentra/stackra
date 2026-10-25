/**
 * Stackra file contract:
 * Purpose: unit tests of `csvCell`: quoting, empty and date cells, and the formula guard on text only.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0367 (decision 10).
 */
import { describe, expect, it } from "@stackra/testing";

import { csvCell } from "#core/functions/csv-cell.function";

describe("csvCell", () => {
  it("quotes where needed", () => {
    expect(csvCell('say "hi", now', ",", true)).toBe('"say ""hi"", now"');
    expect(csvCell("a;b", ";", true)).toBe('"a;b"');
    expect(csvCell("line\nbreak", ",", true)).toBe('"line\nbreak"');
    expect(csvCell(null, ",", true)).toBe("");
    expect(csvCell(new Date("2026-10-25T00:00:00.000Z"), ",", true)).toBe(
      "2026-10-25T00:00:00.000Z",
    );
  });

  it("guards text formulas only", () => {
    expect(csvCell("=SUM(A1)", ",", true)).toBe("'=SUM(A1)");
    expect(csvCell("+966500000000", ",", true)).toBe("'+966500000000");
    expect(csvCell(-5, ",", true)).toBe("-5");
    expect(csvCell("=SUM(A1)", ",", false)).toBe("=SUM(A1)");
  });
});
