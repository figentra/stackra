/**
 * Stackra file contract:
 * Purpose: unit tests of `AnalyticsState`: opted in, opted out and pending, with the codes the template's banner test
 *          compares (`opted_out`, `opted_in`).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 16); ADR 0298.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { AnalyticsState } from "#core/enums/analytics-state.enum";

describe("AnalyticsState", () => {
  it("lists the states in order", () => {
    expect(Enum.values(AnalyticsState)).toEqual(["opted_in", "opted_out", "pending"]);
    expectTypeOf<AnalyticsState>().toEqualTypeOf<"opted_in" | "opted_out" | "pending">();
  });
});
