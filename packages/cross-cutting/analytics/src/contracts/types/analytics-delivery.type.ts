/**
 * Stackra file contract:
 * Purpose: `AnalyticsDelivery` (envelope v2), one analytics event as it leaves the device: its id for dedup, its locked
 *          name, the payload fields its schema declares minus the configured deny list, the instant it was captured,
 *          the anonymous visitor and session ids, the signed-in user id once identified, the groups the visitor is in, its
 *          capture context, and its kind (an event, or an identity link: `identify`, `group`).
 * Boundary: a type only, what an `AnalyticsDriver` receives. Built by `AnalyticsClient` once consent allows: the
 *           visitor and session ids are made only then, so none exists for a visitor who has not granted the category.
 *           A driver sends these ids and never makes its own. `kind` and
 *           `groups` are optional, so a delivery written for envelope v2 is still a `track`.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 1 and 5); ADR 0071 (no identifier before consent); ADR 0305 (rule 20);
 *                     ADR 0294 (decision 15).
 */
import type { AnalyticsDeliveryKind } from "#contracts/enums/analytics-delivery-kind.enum";
import type { AnalyticsContext } from "#contracts/types/analytics-context.type";

/** One event handed to a driver. */
export interface AnalyticsDelivery {
  /**
   * The event's id, `evt_` and a 26-character time-ordered Crockford base32 id (ULID layout, lower case); the same id
   * on every destination and on a server conversion of the same event, so each side can drop a duplicate.
   */
  readonly eventId: string;

  /**
   * What the destination is asked to do: record the event (`track`, also when absent), link the visitor to `userId`
   * (`identify`) or put it in a group (`group`, whose `type` and `id` are in `properties`).
   */
  readonly kind?: AnalyticsDeliveryKind;

  /** The event's name as written in `AnalyticsEvent({ name })`, such as `lead.submitted`; `identify` or `group` otherwise. */
  readonly name: string;

  /** The fields the event's schema declares, without the properties `AnalyticsConfig.denyProperties` names. */
  readonly properties: Readonly<Record<string, unknown>>;

  /** When `track` was called, ISO 8601; an event that waited for consent keeps its capture time. */
  readonly occurredAt: string;

  /** The anonymous visitor id, made after consent. */
  readonly anonymousId: string;

  /** The signed-in user's id, once the host identifies the visitor; absent for an anonymous visitor. */
  readonly userId?: string;

  /** The groups the visitor was in when the event was captured, group type to group id; absent when none. */
  readonly groups?: Readonly<Record<string, string>>;

  /** The id of this visit, made after consent. */
  readonly sessionId: string;

  /** Where the event was captured. */
  readonly context: AnalyticsContext;
}
