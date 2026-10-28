/**
 * Stackra file contract:
 * Purpose: `AnalyticsConversion`, one entry of `AnalyticsConfig.conversions`: the analytics event that is a conversion
 *          (`checkout.completed`), the conversion name the ad pixel fires (`purchase`) and the property whose value is
 *          the shared dedup id (`orderId`).
 * Boundary: a type only; the shipped schema checks it. The `ref` value is the event id on both sides: the server's
 *           `Conversion` of `@stackra/integrations` names the same business id on its integration event (`order.placed`),
 *           so the platform counts the pixel and the server conversion once.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decision 5); ADR 0355 (decision 1); analytics gap 12 (stackra-412).
 */

/** One analytics event the ad pixel fires as a conversion. */
export interface AnalyticsConversion {
  /** The analytics event's name, such as `checkout.completed`. */
  readonly event: string;

  /** The conversion name the pixel fires, such as `purchase`. */
  readonly name: string;

  /** The property holding the business id shared with the server conversion; the delivery's `eventId` when absent. */
  readonly ref?: string | undefined;
}
