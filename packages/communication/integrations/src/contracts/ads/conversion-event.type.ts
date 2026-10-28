/**
 * Stackra file contract:
 * Purpose: `ConversionEvent`, one server-side conversion sent to an ad platform's conversions API (a purchase, a lead,
 *          an add to cart): our event name and id, when it happened, the hashed person, the value and the items, and
 *          the click and browser signals the platform matches it to an ad by.
 * Boundary: a type only. `name` is our event name; the Connection maps it to the platform's own (`Purchase`,
 *           `CompletePayment`, `PURCHASE`, a conversion action) from its settings, never a constant. `eventId` is the
 *           id the browser pixel sent the same event under (the business id both sides read, stackra-412), so the
 *           platform counts it once. Consent comes first (ADR 0472 decision 4): an event is built only when the
 *           visitor's verified snapshot granted `marketing`, and it carries that snapshot's id and categories.
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decision 1); ADR 0134 (personal data); ADR 0472 (decision 4); COM-301; STA-793.
 */
import type { Url } from "@stackra/contracts";
import type { Money } from "@stackra/money";

import type { MatchKeys } from "#contracts/ads/match-keys.type";

/**
 * A server-side conversion.
 *
 * @example
 * const purchase: ConversionEvent = { eventId: "order_42", name: "purchase", occurredAt, person: await matchKeysOf(customer, { phone: "e164" }), value };
 */
export interface ConversionEvent {
  /** The id the pixel used for the same event, so the platform deduplicates. */
  readonly eventId: string;

  /** Our event name (`purchase`, `add_to_cart`, `lead`), mapped by the Connection. */
  readonly name: string;

  /** When it happened. */
  readonly occurredAt: Date;

  /** The person, hashed. */
  readonly person: MatchKeys;

  /** What it was worth. */
  readonly value?: Money;

  /** What was in it, by our SKU (the catalogue's item id). */
  readonly items?: readonly { readonly sku: string; readonly quantity: number }[];

  /** The ad click id the visit carried (`fbclid`, `ttclid`, `gclid`, `ScCid`), sent as the platform names it. */
  readonly clickId?: string;

  /** The page it happened on. */
  readonly pageUrl?: Url;

  /** The visitor's IP address, sent unhashed as every platform asks. */
  readonly ip?: string;

  /** The visitor's user agent, sent unhashed. */
  readonly userAgent?: string;

  /** The consent snapshot it was built under: its id and the category codes it granted (ADR 0472 decision 4). */
  readonly consent?: { readonly snapshotId: string; readonly granted: readonly string[] };
}
