/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: the template's config overrides and gen wiring import
 *          `AnalyticsDriver` from `@stackra/analytics/contracts`; it is the only value exported, and
 *          `AnalyticsDelivery` (envelope v2) and its `AnalyticsContext` resolve to the shape a driver receives.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type { AnalyticsContext, AnalyticsDelivery } from "#contracts/index";

describe("@stackra/analytics/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual(["AnalyticsDriver"]);
  });

  it("types the delivery", () => {
    expectTypeOf<AnalyticsDelivery>().toEqualTypeOf<{
      readonly eventId: string;
      readonly name: string;
      readonly properties: Readonly<Record<string, unknown>>;
      readonly occurredAt: string;
      readonly anonymousId: string;
      readonly userId?: string;
      readonly sessionId: string;
      readonly context: AnalyticsContext;
    }>();
  });

  it("types the capture context", () => {
    expectTypeOf<AnalyticsContext>().toEqualTypeOf<{
      readonly library: { readonly name: string; readonly version?: string };
      readonly page?: { readonly path: string };
      readonly screen?: { readonly name: string };
      readonly locale?: string;
      readonly appVersion?: string;
      readonly region?: string;
    }>();
  });
});
