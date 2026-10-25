/**
 * Stackra file contract:
 * Purpose: type tests of `FiscalLine`: the sample lines type-check, a line with a numeric rate does not.
 * Boundary: test only; type-level checks with one runtime assertion each.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import type { FiscalLine } from "#contracts/types/fiscal-line.type";
import { fiscalDocument } from "#testing/fiscal-document.fixture";

describe("FiscalLine", () => {
  it("takes a computed line", () => {
    const line: FiscalLine = fiscalDocument().lines[0] as FiscalLine;
    expect(line.net.plus(line.tax).toDecimal()).toBe("24.00");
  });

  it("refuses a numeric rate", () => {
    const line = fiscalDocument().lines[0] as FiscalLine;
    // @ts-expect-error -- a rate is a decimal string
    const numeric: FiscalLine = { ...line, taxRate: 20 };
    expect(numeric.taxRate).toBe(20);
  });
});
