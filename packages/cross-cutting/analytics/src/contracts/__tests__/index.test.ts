/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: the template's config overrides and gen wiring import
 *          `AnalyticsDriver` from `@stackra/analytics/contracts`; the values are the three ports and the delivery kind enum,
 *          `AnalyticsDelivery` (envelope v2 with kind and groups) and its `AnalyticsContext` resolve to the shape a
 *          driver receives, and `AnalyticsIdentityRecord` to the kept identity.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type {
  AnalyticsContext,
  AnalyticsDelivery,
  AnalyticsDeliveryKind,
  AnalyticsIdentityRecord,
} from "#contracts/index";

describe("@stackra/analytics/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "AnalyticsDeliveryKind",
      "AnalyticsDriver",
      "AnalyticsDriverLookup",
      "AnalyticsIdentity",
      "AnalyticsOfflineQueue",
    ]);
  });

  it("types the delivery", () => {
    expectTypeOf<AnalyticsDelivery>().toEqualTypeOf<{
      readonly eventId: string;
      readonly kind?: AnalyticsDeliveryKind;
      readonly name: string;
      readonly properties: Readonly<Record<string, unknown>>;
      readonly occurredAt: string;
      readonly anonymousId: string;
      readonly userId?: string;
      readonly groups?: Readonly<Record<string, string>>;
      readonly sessionId: string;
      readonly context: AnalyticsContext;
    }>();
  });

  it("names the delivery kinds and types the kept identity", () => {
    expect([...Enum.values(contracts.AnalyticsDeliveryKind)].sort()).toEqual([
      "group",
      "identify",
      "track",
    ]);
    expectTypeOf<AnalyticsIdentityRecord>().toEqualTypeOf<{
      readonly anonymousId: string;
      readonly userId?: string;
      readonly groups?: Readonly<Record<string, string>>;
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
