/**
 * Stackra file contract:
 * Purpose: type tests of `MarketRecord`: the tenant market is required, the other subjects are optional.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0385.
 */
import { describe, expectTypeOf, it } from "@stackra/testing";

import type { MarketRecord } from "#core/types/market-record.type";

describe("MarketRecord", () => {
  it("requires only the scope market", () => {
    expectTypeOf<{ scope: string }>().toExtend<MarketRecord>();
    expectTypeOf<Record<string, never>>().not.toExtend<MarketRecord>();
    expectTypeOf<MarketRecord["buyer"]>().toEqualTypeOf<string | undefined>();
  });
});
