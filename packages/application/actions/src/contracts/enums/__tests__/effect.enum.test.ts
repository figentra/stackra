/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Effect`: the six snake_case effect tags of ADR 0099 as amended, `bulk` included.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0099 (decision 2); ADR 0360 (decision 10).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Effect } from "#contracts/enums/effect.enum";

describe("Effect", () => {
  it("holds the effect tags", () => {
    expect(Enum.values(Effect)).toEqual([
      "financial",
      "security",
      "pii",
      "external_communication",
      "irreversible",
      "bulk",
    ]);
    expectTypeOf(Effect.Bulk).toEqualTypeOf<"bulk">();
  });
});
