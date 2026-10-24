/**
 * Stackra file contract:
 * Purpose: `AnalyticsState`, where delivery stands for the current visitor: events are sent, events are dropped, or
 *          events wait in the bounded queue for a decision.
 * Boundary: an `Enum.of` value plus the type of the same name, read from `AnalyticsClient.state`. It mirrors the
 *           consent status of `AnalyticsConfig.consentCategory` and is never stored: consent is the record.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 1, 2 and 5); ADR 0294 (decision 16); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/**
 * The delivery states.
 *
 * @example
 * expect(analytics.state).toBe(AnalyticsState.OptedOut);
 */
export const AnalyticsState = Enum.of({
  /** The category is granted: events are sent as they are tracked. */
  OptedIn: "opted_in",
  /** The category is refused, or the browser sends Global Privacy Control: events are dropped unsent. */
  OptedOut: "opted_out",
  /** No decision yet: events wait in the bounded queue. */
  Pending: "pending",
});

/** One of the codes above. */
export type AnalyticsState = Enum.Value<typeof AnalyticsState>;
