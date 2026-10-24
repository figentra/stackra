/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: the template's config overrides and gen wiring import
 *          `AnalyticsDriver` from `@stackra/analytics/contracts`; it is the only value exported, and
 *          `AnalyticsDelivery` resolves to the shape a driver receives.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type { AnalyticsDelivery } from "#contracts/index";

describe("@stackra/analytics/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual(["AnalyticsDriver"]);
  });

  it("types the delivery", () => {
    expectTypeOf<AnalyticsDelivery>().toEqualTypeOf<{
      readonly name: string;
      readonly properties: Readonly<Record<string, unknown>>;
      readonly occurredAt: string;
    }>();
  });
});
