/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryAnalyticsIdentityDriver`: an `AnalyticsIdentity` that starts empty, keeps what is
 *          written, forgets on clear, and shares nothing between instances.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0266 (decision 2); ADR 0298 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { AnalyticsIdentity } from "#contracts/ports/analytics-identity.port";
import { MemoryAnalyticsIdentityDriver } from "#core/drivers/memory-analytics-identity.driver";

describe("MemoryAnalyticsIdentityDriver", () => {
  it("keeps, reads back and forgets the identity", () => {
    const identity = new MemoryAnalyticsIdentityDriver();
    expect(identity).toBeInstanceOf(AnalyticsIdentity);
    expect(identity.read()).toBeNull();
    identity.write({ anonymousId: "anon_1", userId: "usr_1" });
    expect(identity.read()).toEqual({ anonymousId: "anon_1", userId: "usr_1" });
    expect(new MemoryAnalyticsIdentityDriver().read()).toBeNull();
    identity.clear();
    expect(identity.read()).toBeNull();
  });
});
