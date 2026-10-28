/**
 * Stackra file contract:
 * Purpose: the `storage` driver of the `AnalyticsIdentity` port, a device app's store: the identity is a JSON value in
 *          the `prefs` area of `@stackra/storage` (`analytics.identity`), kept `identityExpiryDays` days.
 * Boundary: reads and writes the area synchronously; the runtime hydrates storage before the first frame. Written only
 *           after consent (the client's rule). An unreadable value reads as no identity.
 * Runtime: isomorphic
 * Governing contract: ADR 0256 (decisions 2 and 4: the prefs area, time-to-live); ADR 0298 (decision 5); ADR 0294
 *                     (decision 17: drivers).
 */
import { Driver } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import type { Storage } from "@stackra/storage/contracts";

import type { AnalyticsConfig } from "#config/analytics.config";
import { AnalyticsIdentity } from "#contracts/ports/analytics-identity.port";
import type { AnalyticsIdentityRecord } from "#contracts/types/analytics-identity-record.type";
import { ANALYTICS_IDENTITY_STORAGE_KEY } from "#core/constants/analytics-identity-storage-key.constant";
import { parseAnalyticsIdentity } from "#core/functions/parse-analytics-identity.function";

/**
 * Keeps the identity in client storage.
 *
 * @example
 * const identity = new StorageAnalyticsIdentityDriver(buildConfig(AnalyticsConfig), fakeStorage());
 */
export class StorageAnalyticsIdentityDriver extends Driver(AnalyticsIdentity) {
  private readonly config: AnalyticsConfig;

  private readonly storage: Storage;

  /**
   * @param config - how long the identity is kept.
   * @param storage - the client storage whose `prefs` area holds the identity.
   */
  constructor(config: AnalyticsConfig, storage: Storage) {
    super();
    this.config = config;
    this.storage = storage;
  }

  /** The kept identity, or `null` when absent, expired or unreadable. */
  read(): AnalyticsIdentityRecord | null {
    return parseAnalyticsIdentity(this.storage.prefs.get(ANALYTICS_IDENTITY_STORAGE_KEY));
  }

  /** Keeps `record` for `identityExpiryDays` days. */
  write(record: AnalyticsIdentityRecord): void {
    this.storage.prefs.set(ANALYTICS_IDENTITY_STORAGE_KEY, record, {
      ttl: Duration.days(this.config.identityExpiryDays),
    });
  }

  /** Removes the kept identity. */
  clear(): void {
    this.storage.prefs.delete(ANALYTICS_IDENTITY_STORAGE_KEY);
  }
}
