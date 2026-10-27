/**
 * Stackra file contract:
 * Purpose: type tests of `PackEntry`: one element of a pack's entries, with an optional floor (`min`, `max` or `list`).
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing. Pack
 *           data is a made-up fixture, not any market's values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0370.
 */
import { describe, expectTypeOf, it } from "@stackra/testing";

import type { MarketPack } from "#core/types/market-pack.type";
import type { PackEntry } from "#core/types/pack-entry.type";

describe("PackEntry", () => {
  it("is one entry of a pack", () => {
    expectTypeOf<PackEntry>().toEqualTypeOf<MarketPack["entries"][number]>();
    expectTypeOf<NonNullable<PackEntry["floor"]>["bound"]>().toEqualTypeOf<"min" | "max" | "list">();
  });
});
