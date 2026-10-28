/**
 * Stackra file contract:
 * Purpose: unit tests of `NoneAnalyticsDriverLookupDriver`: an `AnalyticsDriverLookup` that knows no instance.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0263; analytics gap 7 (stackra-407).
 */
import { describe, expect, it } from "@stackra/testing";

import { AnalyticsDriverLookup } from "#contracts/ports/analytics-driver-lookup.port";
import { NoneAnalyticsDriverLookupDriver } from "#core/drivers/none-analytics-driver-lookup.driver";

describe("NoneAnalyticsDriverLookupDriver", () => {
  it("knows no named instance", () => {
    const lookup = new NoneAnalyticsDriverLookupDriver();
    expect(lookup).toBeInstanceOf(AnalyticsDriverLookup);
    expect(lookup.driver("segment")).toBeUndefined();
    expect(lookup.driver("default")).toBeUndefined();
  });
});
