/**
 * Stackra file contract:
 * Purpose: type tests of `ResolvedPack`: a market and its layers.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing. Pack
 *           data is a made-up fixture, not any market's values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0370.
 */
import { describe, expectTypeOf, it } from "@stackra/testing";

import type { MarketPack } from "#core/types/market-pack.type";
import type { ResolvedPack } from "#core/types/resolved-pack.type";

describe("ResolvedPack", () => {
  it("holds the market and its layers", () => {
    expectTypeOf<ResolvedPack["market"]>().toEqualTypeOf<string>();
    expectTypeOf<ResolvedPack["layers"]>().toEqualTypeOf<readonly MarketPack[]>();
  });
});
