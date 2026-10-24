/**
 * Stackra file contract:
 * Purpose: `AnalyticsEvent({ name })`, the kind base of a client product-analytics event:
 *          `analytics.track(LeadSubmitted.create({ plan }))`.
 * Boundary: called only. Declared here, delivered by `@stackra/analytics`, which keeps delivery, consent gating and
 *           the bounded pre-consent queue and imports this package (ADR 0305 rule 20). Its fields carry no personal
 *           data; the analytics config strips it too.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 2, 19 and 20); ADR 0298 (decision 5); ADR 0294 (decision 16).
 */
import { createKind } from "@stackra/container";

import { Event } from "#core/bases/event.base";
import { EVENT_NAME_PATTERN } from "#core/constants/event-name-pattern.constant";
import type { AnalyticsEventOptions } from "#core/types/analytics-event-options.type";
import type { EventClass } from "#core/types/event-class.type";

/** The runtime base. Not exported: authors extend `AnalyticsEvent({ ... })`. */
abstract class AnalyticsEventBase extends Event {
  /** Type-only kind brand. */
  declare protected readonly "~kind": "analytics_event";
}

/** Checks the options. */
function read(options: AnalyticsEventOptions) {
  if (typeof options?.name !== "string" || !EVENT_NAME_PATTERN.test(options.name))
    throw new TypeError(
      `AnalyticsEvent({ name }) needs a dotted snake_case name such as "lead.submitted", got ${JSON.stringify(options?.name)}`,
    );
  return { ...options };
}

/**
 * The analytics event kind base.
 *
 * @example
 * export class LeadSubmitted extends AnalyticsEvent({ name: "lead.submitted" }) {
 *   plan!: string;
 * }
 */
export const AnalyticsEvent = createKind("analytics_event", AnalyticsEventBase, read) as (
  options: AnalyticsEventOptions,
) => EventClass;
