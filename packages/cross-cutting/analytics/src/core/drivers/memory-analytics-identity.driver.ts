/**
 * Stackra file contract:
 * Purpose: the `memory` driver of the `AnalyticsIdentity` port, the default: the identity lives in this process only,
 *          so a new launch (or page load) is a new visitor, as before identity stitching. Also the store of tests.
 * Boundary: in-process state, nothing written anywhere; two instances never share a record.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (decision 2: memory driver first); ADR 0298 (decision 5); ADR 0294 (decision 17).
 */
import { Driver } from "@stackra/container";

import { AnalyticsIdentity } from "#contracts/ports/analytics-identity.port";
import type { AnalyticsIdentityRecord } from "#contracts/types/analytics-identity-record.type";

/**
 * Keeps the identity in memory.
 *
 * @example
 * const identity = new MemoryAnalyticsIdentityDriver();
 * identity.write({ anonymousId: "anon_1" });
 * identity.read(); // { anonymousId: "anon_1" }
 */
export class MemoryAnalyticsIdentityDriver extends Driver(AnalyticsIdentity) {
  private record: AnalyticsIdentityRecord | null = null;

  /** The kept identity, or `null`. */
  read(): AnalyticsIdentityRecord | null {
    return this.record;
  }

  /** Keeps `record` in memory, replacing the last one. */
  write(record: AnalyticsIdentityRecord): void {
    this.record = record;
  }

  /** Forgets the identity. */
  clear(): void {
    this.record = null;
  }
}
