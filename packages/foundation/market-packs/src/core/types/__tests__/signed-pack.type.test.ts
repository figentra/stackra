/**
 * Stackra file contract:
 * Purpose: type tests of `SignedPack`: the output of the schema.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing. Pack
 *           data is a made-up fixture, not any market's values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0370.
 */
import { describe, expectTypeOf, it } from "@stackra/testing";
import type { z } from "zod";

import type { SIGNED_PACK_SCHEMA } from "#core/constants/signed-pack-schema.constant";
import type { MarketPack } from "#core/types/market-pack.type";
import type { SignedPack } from "#core/types/signed-pack.type";

describe("SignedPack", () => {
  it("is the schema output", () => {
    expectTypeOf<SignedPack>().toEqualTypeOf<z.output<typeof SIGNED_PACK_SCHEMA>>();
    expectTypeOf<SignedPack["pack"]>().toEqualTypeOf<MarketPack>();
  });
});
