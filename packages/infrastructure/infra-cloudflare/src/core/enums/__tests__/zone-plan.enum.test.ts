/**
 * Stackra file contract:
 * Purpose: unit tests of `ZonePlan`: free and pro.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0290 (decision 13).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ZonePlan } from "#core/enums/zone-plan.enum";

describe("ZonePlan", () => {
  it("lists the two plans", () => {
    expect(Enum.values(ZonePlan)).toEqual(["free", "pro"]);
    expectTypeOf<ZonePlan>().toEqualTypeOf<"free" | "pro">();
  });
});
