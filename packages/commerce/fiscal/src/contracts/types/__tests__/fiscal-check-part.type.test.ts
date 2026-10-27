/**
 * Stackra file contract:
 * Purpose: type tests of `FiscalCheckPart`: lines nullable for a split by amount, tenders required.
 * Boundary: test only; type-level checks with one runtime assertion each.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import type { FiscalCheckPart } from "#contracts/types/fiscal-check-part.type";

describe("FiscalCheckPart", () => {
  it("takes a part with no lines and refuses one without tenders", () => {
    const part: FiscalCheckPart = {
      id: "p1",
      number: "R-1",
      paidAt: new Date(0),
      lines: null,
      payments: [],
    };
    // @ts-expect-error -- tenders are required
    const bare: FiscalCheckPart = { id: "p2", number: "R-2", paidAt: new Date(0), lines: null };
    expect([part.lines, bare.id]).toEqual([null, "p2"]);
  });
});
