/**
 * Stackra file contract:
 * Purpose: type tests of `Segment`: its fields resolve to the documented types.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366.
 */
import { describe, expectTypeOf, it } from "@stackra/testing";

import type { Segment } from "#core/types/segment.type";

describe("Segment", () => {
  it("resolves its fields", () => {
    expectTypeOf<Segment>().toEqualTypeOf<{
      readonly minutes: number;
      readonly occupies: boolean;
    }>();
  });
});
