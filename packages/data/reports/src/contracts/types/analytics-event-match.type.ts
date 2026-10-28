/**
 * Stackra file contract:
 * Purpose: `AnalyticsEventMatch`, the events one funnel step or cohort counts: an event name and, optionally, event
 *          property values that must all hold (a list means any one of its values).
 * Boundary: a type only. Names and values are data a driver passes as filters, never query text. A driver refuses a
 *           property name outside `[A-Za-z_$][A-Za-z0-9_$.:-]*` and the property it isolates scopes by, so a match can
 *           only narrow what the caller reads.
 * Runtime: isomorphic
 * Governing contract: ADR 0163 (decision 5 as amended 2026-10-28); ADR 0160 (no caller text in a query); ADR 0294
 *                     (decision 15: the leaf entry).
 */
import type { AnalyticsPropertyValue } from "#contracts/types/analytics-property-value.type";

/** Which events count. */
export interface AnalyticsEventMatch {
  /** The event name as the analytics client sent it (`checkout_started`). */
  readonly event: string;

  /** Event property name to the value, or any of the values, it must have. */
  readonly where?: Readonly<
    Record<string, AnalyticsPropertyValue | readonly AnalyticsPropertyValue[]>
  >;
}
