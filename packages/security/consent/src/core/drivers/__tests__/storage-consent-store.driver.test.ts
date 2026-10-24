/**
 * Stackra file contract:
 * Purpose: unit tests of `StorageConsentStoreDriver`: it keeps the decision under `consent.decision` in the `prefs`
 *          area with an `expiryDays` time-to-live, reads it back, clears it, and reads an unreadable value as no
 *          decision.
 * Boundary: test only; the storage is @stackra/storage's in-memory fake.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0256 (decisions 2 and 4); ADR 0298 (decision 3).
 */
import { buildConfig } from "@stackra/config";
import { Duration } from "@stackra/contracts";
import { fakeStorage } from "@stackra/storage/testing";
import { describe, expect, it, vi } from "@stackra/testing";

import { ConsentConfig } from "#config/consent.config";
import { ConsentStore } from "#contracts/ports/consent-store.port";
import { StorageConsentStoreDriver } from "#core/drivers/storage-consent-store.driver";

/** A stored decision. */
const RECORD = {
  policyVersion: "2026-10",
  decidedAt: "2026-10-24T09:00:00.000Z",
  categories: { analytics: false, crash_replay: true },
};

describe("StorageConsentStoreDriver", () => {
  it("is a ConsentStore", () => {
    expect(new StorageConsentStoreDriver(buildConfig(ConsentConfig), fakeStorage())).toBeInstanceOf(
      ConsentStore,
    );
  });

  it("keeps the decision in prefs for expiryDays and reads it back", () => {
    const storage = fakeStorage();
    const set = vi.spyOn(storage.prefs, "set");
    const store = new StorageConsentStoreDriver(
      buildConfig(ConsentConfig, { values: { expiryDays: 30 } }),
      storage,
    );
    store.write(RECORD);
    expect(set).toHaveBeenCalledWith("consent.decision", RECORD, { ttl: Duration.days(30) });
    expect(store.read()).toEqual(RECORD);
  });

  it("clears the decision", () => {
    const storage = fakeStorage();
    const store = new StorageConsentStoreDriver(buildConfig(ConsentConfig), storage);
    store.write(RECORD);
    store.clear();
    expect(store.read()).toBeNull();
    expect(storage.prefs.has("consent.decision")).toBe(false);
  });

  it("reads nothing and an unreadable value as no decision", () => {
    const storage = fakeStorage();
    const store = new StorageConsentStoreDriver(buildConfig(ConsentConfig), storage);
    expect(store.read()).toBeNull();
    storage.prefs.set("consent.decision", { granted: true });
    expect(store.read()).toBeNull();
  });
});
