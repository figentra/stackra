/**
 * Stackra file contract:
 * Purpose: `AnalyticsDelivery`, one analytics event as it leaves the device: its locked name, the payload fields its
 *          schema declares minus the configured deny list, and the instant it was captured.
 * Boundary: a type only, what an `AnalyticsDriver` receives. Built by `AnalyticsClient` once consent allows; it carries
 *           no visitor identity of its own, only what the event class declares.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 1 and 5); ADR 0305 (rule 20); ADR 0294 (decision 15).
 */

/** One event handed to a driver. */
export interface AnalyticsDelivery {
  /** The event's name as written in `AnalyticsEvent({ name })`, such as `lead.submitted`. */
  readonly name: string;

  /** The fields the event's schema declares, without the properties `AnalyticsConfig.denyProperties` names. */
  readonly properties: Readonly<Record<string, unknown>>;

  /** When `track` was called, ISO 8601; an event that waited for consent keeps its capture time. */
  readonly occurredAt: string;
}
