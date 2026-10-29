/**
 * Stackra file contract:
 * Purpose: `DeviceSearchItem`, one entry of the phone's own search (iOS Spotlight, Android launcher search): what the
 *          person sees in the result and the deep link that opens the record in the app.
 * Boundary: a type only. `url` is the entry's identity on every driver, so removing an entry names its link. It holds
 *           only what the person may read on the device; the indexer applies the visibility rules before this exists.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decision 5: port and driver); ADR 0250.
 */

/** One record as the phone's search shows it. */
export interface DeviceSearchItem {
  /** The deep link that opens the record in the app; also the entry's identity. */
  readonly url: string;

  /** The record's kind (`crm.customer`), so the OS can group and drop entries by kind. */
  readonly kind: string;

  /** The result's title. */
  readonly title: string;

  /** The result's second line, or null for none. */
  readonly description: string | null;

  /** Extra words the result is found by. */
  readonly keywords: readonly string[];
}
