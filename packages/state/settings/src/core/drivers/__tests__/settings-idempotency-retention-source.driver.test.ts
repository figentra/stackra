/**
 * Stackra file contract:
 * Purpose: unit tests of `SettingsIdempotencyRetentionSourceDriver` and its `IdempotencySettings` group: it is an
 *          `IdempotencyRetentionSource`, answers 24 hours by default and the hours the platform stores, and throws when a
 *          stored value is outside 1 to 24, so the call fails closed.
 * Boundary: test only; the store is this package's memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0136 (decision 3); ADR 0213 (decision 2).
 */
import { Duration, IdempotencyRetentionSource } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { MemorySettingValueStoreDriver } from "#core/drivers/memory-setting-value-store.driver";
import { SettingsIdempotencyRetentionSourceDriver } from "#core/drivers/settings-idempotency-retention-source.driver";
import { SettingsReader } from "#core/services/settings-reader.service";

/** A driver over a memory store. */
function setup() {
  const store = new MemorySettingValueStoreDriver();
  return {
    store,
    source: new SettingsIdempotencyRetentionSourceDriver(new SettingsReader(store)),
  };
}

describe(SettingsIdempotencyRetentionSourceDriver, () => {
  it("is an IdempotencyRetentionSource that keeps 24 hours by default", async () => {
    const { source } = setup();
    expect(source).toBeInstanceOf(IdempotencyRetentionSource);
    expect(await source.retention(undefined)).toEqual(Duration.hours(24));
  });

  it("answers the hours the platform stores", async () => {
    const { store, source } = setup();
    await store.write("idempotency", {}, { retentionHours: 2 });
    expect(await source.retention(undefined)).toEqual(Duration.hours(2));
  });

  it("throws when a stored window breaks the bounds", async () => {
    const { store, source } = setup();
    await store.write("idempotency", {}, { retentionHours: 25 });
    await expect(source.retention(undefined)).rejects.toThrow();
    await store.write("idempotency", {}, { retentionHours: 0 });
    await expect(source.retention(undefined)).rejects.toThrow();
  });
});
