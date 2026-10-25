/**
 * Stackra file contract:
 * Purpose: type tests of `ResolvedValue`: a value with its provenance and an optional floor.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing. Pack
 *           data is a made-up fixture, not any market's values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0370.
 */
import { describe, expectTypeOf, it } from "@stackra/testing";

import type { PackValue } from "#core/types/pack-value.type";
import type { ResolvedValue } from "#core/types/resolved-value.type";

describe("ResolvedValue", () => {
  it("carries the value and where it came from", () => {
    expectTypeOf<ResolvedValue["value"]>().toEqualTypeOf<PackValue>();
    expectTypeOf<ResolvedValue["market"]>().toEqualTypeOf<string>();
    expectTypeOf<ResolvedValue["version"]>().toEqualTypeOf<string>();
    expectTypeOf<NonNullable<ResolvedValue["floor"]>["law"]>().toEqualTypeOf<string>();
  });
});
