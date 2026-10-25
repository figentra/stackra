/**
 * Stackra file contract:
 * Purpose: unit tests of `taxBreakdown`: one group per category, rate and exemption, summed, in first-seen order.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import type { FiscalLine } from "#contracts/types/fiscal-line.type";
import { taxBreakdown } from "#core/functions/tax-breakdown.function";
import { fiscalDocument } from "#testing/fiscal-document.fixture";

describe("taxBreakdown", () => {
  it("sums lines that share a rate and keeps the order", () => {
    const [first, second] = fiscalDocument().lines as readonly [FiscalLine, FiscalLine];
    const groups = taxBreakdown([first, second, first]);
    expect(
      groups.map((group) => [group.rate, group.net.toDecimal(), group.tax.toDecimal()]),
    ).toEqual([
      ["20", "40.00", "8.00"],
      ["10", "10.00", "1.00"],
    ]);
  });

  it("keeps exempt lines apart from taxed lines at the same rate", () => {
    const [line] = fiscalDocument().lines as readonly [FiscalLine, FiscalLine];
    const exempt = {
      ...line,
      taxCategory: "E",
      taxRate: "0",
      exemption: { code: "VATEX-1", reason: "Exempt" },
    };
    const zero = { ...line, taxCategory: "E", taxRate: "0", exemption: null };
    expect(taxBreakdown([exempt, zero]).map((group) => group.exemption?.code ?? null)).toEqual([
      "VATEX-1",
      null,
    ]);
  });

  it("is empty for no lines", () => {
    expect(taxBreakdown([])).toEqual([]);
  });
});
