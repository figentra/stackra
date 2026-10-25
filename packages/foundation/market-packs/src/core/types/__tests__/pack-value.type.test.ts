/**
 * Stackra file contract:
 * Purpose: type tests of `PackValue`: any JSON value.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing. Pack
 *           data is a made-up fixture, not any market's values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0370.
 */
import { describe, expectTypeOf, it } from "@stackra/testing";

import type { PackEntry } from "#core/types/pack-entry.type";
import type { PackValue } from "#core/types/pack-value.type";

describe("PackValue", () => {
  it("is an entry's JSON value", () => {
    expectTypeOf<PackValue>().toEqualTypeOf<PackEntry["value"]>();
    expectTypeOf<{ rate: number; methods: string[] }>().toExtend<PackValue>();
    expectTypeOf<null>().toExtend<PackValue>();
  });
});
