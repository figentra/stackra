/**
 * Stackra file contract:
 * Purpose: `AnalyticsDeliveryKind`, what an `AnalyticsDelivery` asks a destination to do: record an event (`track`),
 *          link the anonymous visitor to a signed-in user (`identify`), or put the visitor in a group (`group`).
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry. A delivery without a kind is a
 *           `track` (envelope v2 deliveries written before identity stitching). A driver that cannot stitch drops
 *           `identify` and `group` deliveries rather than recording them as events.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decision 5); ADR 0294 (decisions 15 and 16).
 */
import { Enum } from "@stackra/contracts";

/**
 * The kinds of delivery.
 *
 * @example
 * if ((delivery.kind ?? AnalyticsDeliveryKind.Track) === AnalyticsDeliveryKind.Identify) link(delivery);
 */
export const AnalyticsDeliveryKind = Enum.of({
  /** An analytics event the code tracked. */
  Track: "track",
  /** The visitor signed in: `userId` and `anonymousId` are the same person from now on. */
  Identify: "identify",
  /** The visitor joined a group; `properties` holds its `type` and `id`. */
  Group: "group",
});

/** One of the kinds above. */
export type AnalyticsDeliveryKind = Enum.Value<typeof AnalyticsDeliveryKind>;
