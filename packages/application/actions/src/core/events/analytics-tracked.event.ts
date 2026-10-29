/**
 * Stackra file contract:
 * Purpose: `AnalyticsTracked`, the integration event the pipeline writes for a call that declares `analytics` and
 *          whose consent grants `analytics`: the analytics event's name and properties, with the ids a destination
 *          needs (the event id, the consent subject as the anonymous id, the user id, the call id) and the call's
 *          locale. `@stackra/analytics/node` relays it to the server destinations as an `AnalyticsDelivery`.
 * Boundary: an integration event (`analytics.tracked`, version 1). An action's successful call writes it in its unit
 *           of work, so a rolled-back call tracks nothing; a refusal and a query write it after the call. Usage,
 *           audit, analytics and domain events stay four streams (ADR 0216 decision 1). It registers its schema when
 *           the module loads (STA-339 replaces the registration).
 * Runtime: isomorphic
 * Governing contract: ADR 0216 (decision 1); ADR 0472 (decision 3); ADR 0141; gap analysis analytics 10 (STA-1512).
 */
import type { Json } from "@stackra/contracts";
import { IntegrationEvent } from "@stackra/events";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

/**
 * One server-side analytics event.
 *
 * @example
 * AnalyticsTracked.create({ eventId, name: "lead.submitted", properties, occurredAt, anonymousId, callId, key, locale });
 */
export class AnalyticsTracked extends IntegrationEvent({ name: "analytics.tracked" }) {
  /** The event's id (`evt_...`), the same on every destination. */
  eventId!: string;

  /** The analytics event's name (`lead.submitted`), or `action.called`. */
  name!: string;

  /** The analytics event's declared fields, or the generic event's key, outcome, duration and origin. */
  properties!: Record<string, Json>;

  /** When the call ran, ISO 8601. */
  occurredAt!: string;

  /** The consent snapshot's subject: the visitor's analytics anonymous id. */
  anonymousId!: string;

  /** The signed-in user's public id; absent for any other actor. */
  userId?: string;

  /** The call's id. */
  callId!: string;

  /** The action's or query's locked key. */
  key!: string;

  /** The call's BCP 47 locale. */
  locale!: string;

  /** The scope node's public id; absent for a platform call. */
  scopeId?: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    AnalyticsTracked,
    z.object({
      eventId: z.string(),
      name: z.string(),
      properties: z.record(
        z.string(),
        z.custom<Json>(() => true),
      ),
      occurredAt: z.string(),
      anonymousId: z.string(),
      userId: z.string().optional(),
      callId: z.string(),
      key: z.string(),
      locale: z.string(),
      scopeId: z.string().optional(),
    }),
  ],
]);
