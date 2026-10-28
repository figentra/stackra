/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./react` entry: the template's contact page and scanner hook import
 *          `useAnalytics` from `@stackra/analytics/react`; it is the only value exported and returns the client.
 * Boundary: test only; imports the stand-in barrel through its `#react` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { AnalyticsClient } from "#core/index";
import * as react from "#react/index";

describe("@stackra/analytics/react", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(react).sort()).toEqual(["useAnalytics", "useAutocapture"]);
  });

  it("returns the analytics client", () => {
    expectTypeOf(react.useAnalytics).returns.toEqualTypeOf<AnalyticsClient>();
  });
});
