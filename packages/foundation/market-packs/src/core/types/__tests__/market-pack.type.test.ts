/**
 * Stackra file contract:
 * Purpose: type tests of `MarketPack`: the output of the schema.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing. Pack
 *           data is a made-up fixture, not any market's values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0370.
 */
import { describe, expectTypeOf, it } from "@stackra/testing";
import type { z } from "zod";

import type { MARKET_PACK_SCHEMA } from "#core/constants/market-pack-schema.constant";
import type { MarketPack } from "#core/types/market-pack.type";

describe("MarketPack", () => {
  it("is the schema output", () => {
    expectTypeOf<MarketPack>().toEqualTypeOf<z.output<typeof MARKET_PACK_SCHEMA>>();
    expectTypeOf<MarketPack["status"]>().toEqualTypeOf<"draft" | "beta" | "live" | "retired">();
    expectTypeOf<MarketPack["section"]>().toEqualTypeOf<string | undefined>();
  });
});
