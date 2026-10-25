/**
 * Stackra file contract:
 * Purpose: unit tests of `QuotedRedemption`: a registered shape of the member, the capped offer and the reference,
 *          refusing negative points or amounts.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 18).
 */
import { describe, expect, it } from "@stackra/testing";

import { QuotedRedemption } from "#node/schemas/quoted-redemption.schema";

describe("QuotedRedemption", () => {
  const valid = { memberId: "usr_1", points: 300, amountMinor: 300, reference: "ord_2" };

  it("holds the member, the offer and the reference", () => {
    expect({ ...QuotedRedemption.create(valid) }).toEqual(valid);
  });

  it("refuses negative points or amounts", () => {
    expect(() => QuotedRedemption.create({ ...valid, points: -1 })).toThrow();
    expect(() => QuotedRedemption.create({ ...valid, amountMinor: -1 })).toThrow();
  });
});
