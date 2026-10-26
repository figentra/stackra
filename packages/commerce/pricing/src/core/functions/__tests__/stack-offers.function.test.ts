/**
 * Stackra file contract:
 * Purpose: unit tests of `stackOffers`: offers the stacking rule lets stack all apply, the best single other offer applies, and the rest are refused.
 * Boundary: test only; rows are test data standing in for `offer:<name>` and `rate-card:<name>` seed records.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0393 (decision 4); owner M3-6.
 */
import { describe, expect, it } from "@stackra/testing";

import { stackOffers } from "#core/functions/stack-offers.function";

import { OFFERS } from "./offer-fixtures";

/** The seeded stacking rule's answer: only the annual discount stacks. */
const stacks = (offer: { key: string }): boolean => offer.key === "offer:annual";

describe("stackOffers", () => {
  it("keeps the best single programme plus what stacks", () => {
    const stack = stackOffers([OFFERS.founding, OFFERS.startup, OFFERS.annual], stacks);
    expect(stack.applied.map((offer) => offer.key)).toEqual(["offer:startup", "offer:annual"]);
    expect(stack.refused.map((offer) => offer.key)).toEqual(["offer:founding"]);
  });

  it("keeps the first requested on a tie and refuses nothing for one offer", () => {
    const twin = { ...OFFERS.startup };
    const tie = stackOffers([OFFERS.startup, twin], stacks);
    expect([tie.applied, tie.refused]).toEqual([[OFFERS.startup], [twin]]);
    expect(tie.applied[0]).toBe(OFFERS.startup);
    expect(stackOffers([OFFERS.founding], stacks)).toEqual({
      applied: [OFFERS.founding],
      refused: [],
    });
    expect(stackOffers([], stacks)).toEqual({ applied: [], refused: [] });
  });
});
