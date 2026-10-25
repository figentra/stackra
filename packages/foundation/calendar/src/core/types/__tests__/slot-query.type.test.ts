/**
 * Stackra file contract:
 * Purpose: type tests of `SlotQuery`: its fields resolve to the documented types.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366.
 */
import { describe, expectTypeOf, it } from "@stackra/testing";

import type { SlotQuery } from "#core/types/slot-query.type";

describe("SlotQuery", () => {
  it("resolves its fields", () => {
    expectTypeOf<SlotQuery["segments"][number]["occupies"]>().toEqualTypeOf<boolean>();
    expectTypeOf<SlotQuery["limit"]>().toEqualTypeOf<number | undefined>();
  });
});
