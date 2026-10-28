/**
 * Stackra file contract:
 * Purpose: the `AnalyticsIdentity` port: where the visitor's analytics identity (`AnalyticsIdentityRecord`) is kept
 *          between launches, so funnels and retention see one visitor instead of one per page load. Config
 *          `analytics.identityDriver` picks the driver: `memory` (the default; nothing outlives the launch), `cookie`
 *          (the web: one first-party cookie) or `storage` (a device: the `prefs` area).
 * Boundary: an abstract class that is its own token. Storage only and synchronous, like the consent store: the consent
 *           rule is `AnalyticsClient`'s, which writes only while the category is granted and clears on refusal or
 *           `reset`, so no driver checks consent. A driver never throws on a missing or unreadable record.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 1 and 5); ADR 0071; ADR 0294 (decisions 15, 16 and 17).
 */
import { Port } from "@stackra/contracts";

import type { AnalyticsIdentityRecord } from "#contracts/types/analytics-identity-record.type";

/**
 * Keeps the visitor's analytics identity.
 *
 * @example
 * export class MemoryAnalyticsIdentityDriver extends Driver(AnalyticsIdentity) {
 *   read() { return this.record; }
 *   write(record: AnalyticsIdentityRecord) { this.record = record; }
 *   clear() { this.record = null; }
 * }
 */
export abstract class AnalyticsIdentity extends Port {
  /** The kept identity, or `null` when none is kept or it cannot be read. */
  abstract read(): AnalyticsIdentityRecord | null;

  /** Replaces the kept identity with `record`. */
  abstract write(record: AnalyticsIdentityRecord): void;

  /** Removes the kept identity; nothing happens when there is none. */
  abstract clear(): void;
}
