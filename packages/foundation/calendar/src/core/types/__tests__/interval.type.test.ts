/**
 * Stackra file contract:
 * Purpose: type tests of `Interval`: its fields resolve to the documented types.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366.
 */
import { describe, expectTypeOf, it } from "@stackra/testing";

import type { Interval } from "#core/types/interval.type";

describe("Interval", () => {
  it("resolves its fields", () => {
    expectTypeOf<Interval>().toEqualTypeOf<{ readonly start: string; readonly end: string }>();
  });
});
