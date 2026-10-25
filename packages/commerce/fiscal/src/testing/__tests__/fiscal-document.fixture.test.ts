/**
 * Stackra file contract:
 * Purpose: unit tests of `fiscalDocument`: a consistent sample whose totals add up, with whole-field overrides.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0266 (decision 2); ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { FiscalDocumentKind } from "#contracts/enums/fiscal-document-kind.enum";
import { fiscalDocument } from "#testing/fiscal-document.fixture";

describe("fiscalDocument", () => {
  it("is consistent: lines sum to the totals and the tender covers the gross", () => {
    const document = fiscalDocument();
    const net = document.lines.reduce(
      (sum, line) => sum.plus(line.net),
      document.net.minus(document.net),
    );
    const tax = document.lines.reduce(
      (sum, line) => sum.plus(line.tax),
      document.tax.minus(document.tax),
    );
    expect([net.equals(document.net), tax.equals(document.tax)]).toEqual([true, true]);
    expect(document.payments[0]?.amount.equals(document.gross)).toBe(true);
  });

  it("applies overrides", () => {
    expect(fiscalDocument({ kind: FiscalDocumentKind.Simplified, buyer: null })).toMatchObject({
      kind: "simplified",
      buyer: null,
    });
  });
});
