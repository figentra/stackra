/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the values the template imports from `@stackra/analytics`
 *          (`AnalyticsConfig`, `AnalyticsConfig$`, and the `posthog`, `none` and `memory` drivers from the gen wiring)
 *          are exported, with the client, the state and the options shape; the port and the internals are not.
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
      "AnalyticsClient",
      "AnalyticsConfig",
      "AnalyticsConfig$",
      "AnalyticsOptions",
      "AnalyticsState",
      "MemoryAnalyticsDriver",
      "NoneAnalyticsDriver",
      "PosthogAnalyticsDriver",
    ]);
  });

  it("keeps the port and the internals out of the entry", () => {
    for (const name of ["AnalyticsDriver", "ANALYTICS_CONFIG_SCHEMA"]) {
      expect(name in analytics).toBe(false);
    }
  });

  it("names the shipped drivers", () => {
    expectTypeOf<AnalyticsDriverName>().toEqualTypeOf<"none" | "memory" | "posthog">();
  });
});
