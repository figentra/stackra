/**
 * Stackra file contract:
 * Purpose: `CallAnalytics`, what `Action({ analytics })` and `Query({ analytics })` take: `true` for the generic
 *          `action.called` event (key, outcome, duration, origin), or an `AnalyticsEvent` class whose declared fields
 *          the pipeline reads from the call's output, then its input.
 * Boundary: a type only. The pipeline writes either as `analytics.tracked.v1` through the outbox, only when the call's
 *           consent grants `analytics` (ADR 0472); `@stackra/analytics/node` relays it to the server destinations.
 * Runtime: isomorphic
 * Governing contract: ADR 0216 (decision 1: analytics is its own stream); ADR 0472 (decision 3: a server-side send
 *                     needs the category); gap analysis analytics 10 (stackra-410, STA-1512).
 */
import type { EventClass } from "@stackra/events";

/** The analytics a call emits. */
export type CallAnalytics = true | EventClass;
