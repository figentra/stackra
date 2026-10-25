/**
 * Stackra file contract:
 * Purpose: type tests of `RecurrenceOptions`: its fields resolve to the documented types.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366.
 */
import { describe, expectTypeOf, it } from "@stackra/testing";

import type { RecurrenceOptions } from "#core/types/recurrence-options.type";

describe("RecurrenceOptions", () => {
  it("resolves its fields", () => {
    expectTypeOf<RecurrenceOptions["to"]>().toEqualTypeOf<string>();
    expectTypeOf<RecurrenceOptions["except"]>().toEqualTypeOf<readonly string[] | undefined>();
  });
});
