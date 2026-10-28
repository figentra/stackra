/**
 * Stackra file contract:
 * Purpose: unit tests of `StorageAnalyticsIdentityDriver`: it keeps the identity under `analytics.identity` in the
 *          `prefs` area with an `identityExpiryDays` time-to-live, reads it back, clears it, and reads an unreadable
 *          value as no identity.
 * Boundary: test only; the storage is @stackra/storage's in-memory fake.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0256 (decisions 2 and 4); ADR 0298 (decision 5).
 */
import { buildConfig } from "@stackra/config";
import { Duration } from "@stackra/contracts";
import { fakeStorage } from "@stackra/storage/testing";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { AnalyticsConfig } from "#config/analytics.config";
import { AnalyticsIdentity } from "#contracts/ports/analytics-identity.port";
import { StorageAnalyticsIdentityDriver } from "#core/drivers/storage-analytics-identity.driver";

/** A kept identity. */
const RECORD = { anonymousId: "anon_1", userId: "usr_1", groups: { scope: "scp_1" } };

describe("StorageAnalyticsIdentityDriver", () => {
  it("keeps the identity in prefs for identityExpiryDays and reads it back", () => {
    const storage = fakeStorage();
    const set = vi.spyOn(storage.prefs, "set");
    const identity = new StorageAnalyticsIdentityDriver(
      buildConfig(AnalyticsConfig, { values: { identityExpiryDays: 90 } }),
      storage,
    );
    expect(identity).toBeInstanceOf(AnalyticsIdentity);
    identity.write(RECORD);
    expect(set).toHaveBeenCalledWith("analytics.identity", RECORD, { ttl: Duration.days(90) });
    expect(identity.read()).toEqual(RECORD);
  });

  it("clears the identity and reads an unreadable value as none", () => {
    const storage = fakeStorage();
    const identity = new StorageAnalyticsIdentityDriver(buildConfig(AnalyticsConfig), storage);
    identity.write(RECORD);
    identity.clear();
    expect(identity.read()).toBeNull();
    storage.prefs.set("analytics.identity", { anonymousId: 3 });
    expect(identity.read()).toBeNull();
  });
});
