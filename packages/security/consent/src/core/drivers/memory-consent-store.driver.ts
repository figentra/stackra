/**
 * Stackra file contract:
 * Purpose: the memory driver of the `ConsentStore` port: the decision kept in the instance, for tests (`fakeConsent`),
 *          previews and any target that keeps nothing across launches.
 * Boundary: holds one record per instance; two instances never share it and nothing survives a reload. Keeps exactly
 *           the record it was given.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (memory drivers first); ADR 0294 (decision 17: drivers).
 */
import { Driver } from "@stackra/container";

import { ConsentStore } from "#contracts/ports/consent-store.port";
import type { ConsentRecord } from "#contracts/types/consent-record.type";

/**
 * Keeps the decision in memory.
 *
 * @example
 * const ledger = new ConsentLedger(buildConfig(ConsentConfig), new MemoryConsentStoreDriver());
 */
export class MemoryConsentStoreDriver extends Driver(ConsentStore) {
  private record: ConsentRecord | null = null;

  /** The record last written, or `null`. */
  read(): ConsentRecord | null {
    return this.record;
  }

  /** Keeps `record` in memory. */
  write(record: ConsentRecord): void {
    this.record = record;
  }

  /** Forgets the record. */
  clear(): void {
    this.record = null;
  }
}
