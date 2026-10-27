/**
 * Stackra file contract:
 * Purpose: unit and type tests of `BroadcastAudience`: the two codes in order, principal first (the default), and the
 *          type of the same name.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (amendment item 7).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { BroadcastAudience } from "#core/enums/broadcast-audience.enum";

describe("BroadcastAudience", () => {
  it("has the principal and tenant codes", () => {
    expect(Enum.values(BroadcastAudience)).toEqual(["principal", "tenant"]);
    expect(BroadcastAudience.Scope).toBe("tenant");
    expectTypeOf<BroadcastAudience>().toEqualTypeOf<"principal" | "tenant">();
  });
});
