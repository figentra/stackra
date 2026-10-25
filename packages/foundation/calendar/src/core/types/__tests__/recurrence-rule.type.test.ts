/**
 * Stackra file contract:
 * Purpose: type tests of `RecurrenceRule`: its fields resolve to the documented types.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366.
 */
import { describe, expectTypeOf, it } from "@stackra/testing";

import type { RecurrenceRule } from "#core/types/recurrence-rule.type";

describe("RecurrenceRule", () => {
  it("resolves its fields", () => {
    expectTypeOf<RecurrenceRule["freq"]>().toEqualTypeOf<
      "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"
    >();
    expectTypeOf<RecurrenceRule["byDay"][number]["nth"]>().toEqualTypeOf<number | undefined>();
  });
});
