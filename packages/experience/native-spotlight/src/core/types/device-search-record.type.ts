/**
 * Stackra file contract:
 * Purpose: `DeviceSearchRecord`, a recent record the app offers to the phone's search, with the facts the visibility
 *          rules read: who owns it, whether it is sensitive and when it last changed.
 * Boundary: a type only; the app builds it from records the server already let the person read. The indexer turns
 *           the ones the rules allow into `DeviceSearchItem`s and drops the owner, the flag and the date.
 * Runtime: isomorphic
 * Governing contract: ADR 0333 (record visibility: the server's filter comes first); ADR 0478.
 */

/** A record offered to the phone's search. */
export interface DeviceSearchRecord {
  /** The record's kind (`crm.customer`); only kinds listed in `SpotlightConfig.kinds` are indexed. */
  readonly kind: string;

  /** The user who owns the record; only the signed-in person's own records are indexed. */
  readonly ownerId: string;

  /** True for a record the product marks sensitive (health, a walled matter); never indexed. */
  readonly isSensitive: boolean;

  /** When the record last changed, ISO 8601; older than `SpotlightConfig.maxAgeDays` is not indexed. */
  readonly updatedAt: string;

  /** The deep link that opens the record in the app. */
  readonly url: string;

  /** The result's title. */
  readonly title: string;

  /** The result's second line, or null for none. */
  readonly description: string | null;

  /** Extra words the result is found by. */
  readonly keywords: readonly string[];
}
