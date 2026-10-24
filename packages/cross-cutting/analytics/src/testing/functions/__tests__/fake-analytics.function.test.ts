/**
 * Stackra file contract:
 * Purpose: unit tests of `fakeAnalytics`: each call returns a fresh `AnalyticsFake` with nothing tracked and nothing
 *          decided, as the template's tests start from.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0298.
 */
import { describe, expect, it } from "@stackra/testing";

import { AnalyticsFake } from "#testing/analytics.fake";
import { fakeAnalytics } from "#testing/functions/fake-analytics.function";

describe("fakeAnalytics", () => {
  it("returns a fresh fake with nothing tracked or decided", () => {
    const analytics = fakeAnalytics();
    expect(analytics).toBeInstanceOf(AnalyticsFake);
    expect(analytics.events()).toEqual([]);
    expect(analytics.state).toBe("pending");
    expect(fakeAnalytics()).not.toBe(analytics);
  });
});
