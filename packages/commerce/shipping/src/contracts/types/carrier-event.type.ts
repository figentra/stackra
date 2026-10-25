/**
 * Stackra file contract:
 * Purpose: `CarrierEvent`, one tracking event as the carrier reports it: its own code, when it happened, and the
 *          carrier's text and place.
 * Boundary: a type in the leaf entry. A connector produces these from a tracking call or a webhook, unchanged except
 *           for the instant in ISO 8601; `normaliseTracking` turns them into `TrackingEvent`s.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decision 4).
 */

/**
 * A raw carrier event.
 *
 * @example
 * const events: CarrierEvent[] = [{ code: "OFD", at: "2026-10-25T08:10:00+03:00" }];
 */
export interface CarrierEvent {
  /** The carrier's own event or status code. */
  readonly code: string;

  /** When it happened (ISO 8601 with offset). */
  readonly at: string;

  /** The carrier's description, as given. */
  readonly description?: string;

  /** Where it happened, as the carrier names it. */
  readonly location?: string;
}
