/**
 * Stackra file contract:
 * Purpose: `Conversion`, the configuration that turns one integration event (`order.placed`) into a server-side
 *          `ConversionEvent` (`purchase`): the conversion name, and where in the event's payload the shared dedup id,
 *          the person, the value, the items, the click and browser signals and the consent snapshot are.
 * Boundary: a type only, data a host declares beside the listener that relays the event. Every field but `name` and
 *           `ref` is a dotted path into the payload (`customer.email`); a path that is absent or blank leaves its
 *           field out. The `ref` value is the event id on both sides: the browser `ad-pixel` driver of
 *           `@stackra/analytics` fires the same business id, so the platform counts the pair once. `consent` defaults
 *           to `consent` and must hold `{ snapshotId, granted }` (the call's verified `ctx.consent`); without
 *           `marketing` among `granted` nothing is built.
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decision 1); ADR 0472 (decision 4); ADR 0134 (personal data); analytics gap 12
 *                     (stackra-412).
 */

/** How one integration event becomes a conversion. */
export interface Conversion {
  /** Our conversion name (`purchase`), mapped by the Connection to the platform's. */
  readonly name: string;

  /** The path of the business id shared with the pixel, which becomes the `eventId` (`orderId`). */
  readonly ref: string;

  /** The paths of the person's plain email, E.164 phone and our id; hashed by `matchKeysOf` before sending. */
  readonly person: {
    readonly email?: string;
    readonly phone?: string;
    readonly externalId?: string;
  };

  /** The path of the `Money` the conversion was worth. */
  readonly value?: string;

  /** The path of the `{ sku, quantity }[]` items. */
  readonly items?: string;

  /** The path of the ad click id the visit carried (`adClickIdOf` of `@stackra/analytics`). */
  readonly clickId?: string;

  /** The path of the page URL. */
  readonly pageUrl?: string;

  /** The path of the visitor's IP address. */
  readonly ip?: string;

  /** The path of the visitor's user agent. */
  readonly userAgent?: string;

  /** The path of `{ snapshotId, granted }`, the consent the event was recorded under; `consent` when absent. */
  readonly consent?: string;

  /** The ad platform provider to send to; the ADR 0356 pick when absent. */
  readonly provider?: string;
}
