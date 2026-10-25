/**
 * Stackra file contract:
 * Purpose: unit tests of `ublAmount`: the decimal text with the currency attribute.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import { renderXml } from "#core/functions/render-xml.function";
import { ublAmount } from "#core/functions/ubl-amount.function";

describe("ublAmount", () => {
  it("writes the amount with its currency", () => {
    expect(renderXml(ublAmount("cbc:PayableAmount", Money.ofMinor(1_150, "EUR")))).toBe(
      '<cbc:PayableAmount currencyID="EUR">11.50</cbc:PayableAmount>',
    );
  });
});
