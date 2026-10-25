/**
 * Stackra file contract:
 * Purpose: the `ConsentStore` port: where the visitor's decision is kept. The web keeps it in the decision cookie
 *          (`CookieConsentStoreDriver`), a device in the `prefs` area of client storage (`StorageConsentStoreDriver`),
 *          a test in memory (`MemoryConsentStoreDriver`).
 * Boundary: an abstract class that is its own token; drivers implement it with `extends Driver(ConsentStore)`. Storage
 *           only and synchronous: reading the record is cheap on every platform (a cookie, a hydrated area), and the
 *           rules (decline by default, Global Privacy Control, the policy version, expiry, regions) are the
 *           `ConsentLedger`'s, so no driver repeats them. A driver never throws on a missing or unreadable record.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 3 and 6); ADR 0294 (decisions 15, 16 and 17).
 */
import { Port } from "@stackra/contracts";

import type { ConsentRecord } from "#contracts/types/consent-record.type";

/**
 * Keeps the consent decision.
 *
 * @example
 * export class MemoryConsentStoreDriver extends Driver(ConsentStore) {
 *   read() { return this.record; }
 *   write(record: ConsentRecord) { this.record = record; }
 *   clear() { this.record = null; }
 * }
 */
export abstract class ConsentStore extends Port {
  /** The stored decision, or `null` when none is stored or what is stored cannot be read. */
  abstract read(): ConsentRecord | null;

  /** Replaces the stored decision with `record`. */
  abstract write(record: ConsentRecord): void;

  /** Removes the stored decision; nothing happens when there is none. */
  abstract clear(): void;
}
