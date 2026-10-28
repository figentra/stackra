/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the values the template imports from `@stackra/analytics`
 *          (`AnalyticsConfig`, `AnalyticsConfig$`, and the `posthog`, `none` and `memory` drivers from the gen wiring)
 *          are exported, with the client, the state, the options shape and the `memory`, `cookie` and `storage`
 *          identity drivers and the `none`, `memory` and `storage` offline queue drivers; the port and the internals are not.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as analytics from "#core/index";
import type { AnalyticsDriverName } from "#core/index";

describe("@stackra/analytics", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(analytics).sort()).toEqual([
      "AD_CLICK_ID_PARAMS",
      "AdPixelAnalyticsDriver",
      "AnalyticsClient",
      "AnalyticsConfig",
      "AnalyticsConfig$",
      "AnalyticsOptions",
      "AnalyticsState",
      "CookieAnalyticsIdentityDriver",
      "ElementClicked",
      "MemoryAnalyticsDriver",
      "MemoryAnalyticsIdentityDriver",
      "MemoryAnalyticsOfflineQueueDriver",
      "NoneAdPixelDriver",
      "NoneAnalyticsDriver",
      "NoneAnalyticsDriverLookupDriver",
      "NoneAnalyticsOfflineQueueDriver",
      "PageViewed",
      "PosthogAnalyticsDriver",
      "ScreenViewed",
      "StorageAnalyticsIdentityDriver",
      "StorageAnalyticsOfflineQueueDriver",
      "adClickIdOf",
    ]);
  });

  it("keeps the port and the internals out of the entry", () => {
    for (const name of [
      "AdPixel",
      "AnalyticsDriver",
      "AnalyticsDriverLookup",
      "ANALYTICS_DEFAULT_DESTINATION",
      "AnalyticsIdentity",
      "ANALYTICS_CONFIG_SCHEMA",
      "ANALYTICS_IDENTITY_SCHEMA",
      "parseAnalyticsIdentity",
      "AnalyticsOfflineQueue",
      "ANALYTICS_DELIVERY_SCHEMA",
      "sampleScore",
      "pagePath",
      "TRACK_NAME_PATTERN",
    ]) {
      expect(name in analytics).toBe(false);
    }
  });

  it("names the shipped drivers", () => {
    expectTypeOf<AnalyticsDriverName>().toEqualTypeOf<"none" | "memory" | "posthog" | "ad-pixel">();
  });
});
