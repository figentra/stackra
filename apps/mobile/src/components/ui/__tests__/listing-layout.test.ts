/**
 * Stackra file contract:
 * Purpose: proves the showcase listing's layout rules: one card per row on a phone, two on a tablet (an iPad mini in
 *          portrait included), three from `lg`; and a grid's last row padded with empty cells to a whole row.
 * Boundary: pure functions; no rendering.
 * Runtime: node
 * Governing contract: STA-1371 (listing by width, 2026-10-28); ADR 0022 (test placement).
 */
import { describe, expect, it } from "vitest";

import { cardColumns } from "#src/components/ui/card-columns.function";
import { wholeRows } from "#src/components/ui/whole-rows.function";

describe("cardColumns", () => {
  it("is 1 below sm, 2 to lg, 3 from lg", () => {
    expect(cardColumns({ breakpoint: undefined, sizeClass: "phone" })).toBe(1);
    expect(cardColumns({ breakpoint: "sm", sizeClass: "phone" })).toBe(2);
    expect(cardColumns({ breakpoint: "md", sizeClass: "tablet" })).toBe(2);
    expect(cardColumns({ breakpoint: "lg", sizeClass: "desktop" })).toBe(3);
  });
});

describe("wholeRows", () => {
  it("pads the last row and leaves a whole grid alone", () => {
    expect(wholeRows([1, 2, 3], 2)).toEqual([1, 2, 3, undefined]);
    expect(wholeRows([1, 2, 3], 3)).toEqual([1, 2, 3]);
    expect(wholeRows([1], 1)).toEqual([1]);
    expect(wholeRows([], 3)).toEqual([]);
  });
});
