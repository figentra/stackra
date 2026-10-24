/**
 * Stackra file contract:
 * Purpose: the storage driver of the `ConsentStore` port, a device app's store: the decision is a JSON value in the
 *          `prefs` area of `@stackra/storage` (`consent.decision`), kept `expiryDays` days.
 * Boundary: reads and writes the area synchronously; the runtime hydrates storage before the first frame, and the
 *           storage driver persists each write in the background. An unreadable value reads as no decision.
 * Runtime: isomorphic
 * Governing contract: ADR 0256 (decisions 2 and 4: the prefs area, time-to-live); ADR 0298 (decision 3); ADR 0294
 *                     (decision 17: drivers).
 */
import { Driver } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { Storage } from "@stackra/storage/contracts";

import { ConsentConfig } from "#config/consent.config";
import { ConsentStore } from "#contracts/ports/consent-store.port";
import type { ConsentRecord } from "#contracts/types/consent-record.type";
import { CONSENT_STORAGE_KEY } from "#core/constants/consent-storage-key.constant";
import { parseConsentRecord } from "#core/functions/parse-consent-record.function";

/**
 * Keeps the decision in client storage.
 *
 * @example
 * const store = new StorageConsentStoreDriver(buildConfig(ConsentConfig), fakeStorage());
 */
export class StorageConsentStoreDriver extends Driver(ConsentStore) {
  private readonly config: ConsentConfig;

  private readonly storage: Storage;

  /**
   * @param config - how long a decision is kept.
   * @param storage - the client storage whose `prefs` area holds the decision.
   */
  constructor(config: ConsentConfig, storage: Storage) {
    super();
    this.config = config;
    this.storage = storage;
  }

  /** The stored decision, or `null` when absent, expired or unreadable. */
  read(): ConsentRecord | null {
    return parseConsentRecord(this.storage.prefs.get(CONSENT_STORAGE_KEY));
  }

  /** Stores `record` for `expiryDays` days. */
  write(record: ConsentRecord): void {
    this.storage.prefs.set(CONSENT_STORAGE_KEY, record, {
      ttl: Duration.days(this.config.expiryDays),
    });
  }

  /** Removes the stored decision. */
  clear(): void {
    this.storage.prefs.delete(CONSENT_STORAGE_KEY);
  }
}
