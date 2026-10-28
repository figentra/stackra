/**
 * Stackra file contract:
 * Purpose: `posthogQueryOf(call, scope)`, the body the `posthog` product analytics driver posts to PostHog's query
 *          API for one checked call: a `FunnelsQuery` (ordered steps within a window of days), a `RetentionQuery`
 *          (asking for period 0 plus the intervals), or a `TrendsQuery` of distinct people (`dau`) per period, each
 *          narrowed to the caller's scope by an exact event property filter.
 * Boundary: internal; pure, over checked calls. Every caller value is a JSON value of a structured query node (event
 *           names, property keys and values), never HogQL or SQL text. The scope filter sits on the query's top-level
 *           `properties`, which PostHog ANDs with every series, so no step or match can widen it.
 * Runtime: node
 * Governing contract: ADR 0163 (decision 5 as amended 2026-10-28); ADR 0160 (no caller text in a query); ADR 0323
 *                     (scope isolation).
 */
import type { Json } from "@stackra/contracts";

import type { RetentionPeriod } from "#contracts/enums/retention-period.enum";
import type { AnalyticsDateRange } from "#contracts/types/analytics-date-range.type";
import type { AnalyticsEventMatch } from "#contracts/types/analytics-event-match.type";
import type { PosthogScope } from "#node/types/posthog-scope.type";
import type { ProductAnalyticsCall } from "#node/types/product-analytics-call.type";

/** One PostHog event property filter. */
type PropertyFilter = { key: string; value: Json; operator: "exact"; type: "event" };

/** The PostHog period names. */
const PERIOD: Readonly<Record<RetentionPeriod, string>> = {
  day: "Day",
  week: "Week",
  month: "Month",
};

/** The default funnel window, in days. */
const WINDOW_DAYS = 14;

/** PostHog's date range of `range`, both days included. */
function dateRange(range: AnalyticsDateRange): Json {
  return { date_from: range.from, date_to: range.to, explicitDate: true };
}

/** The top-level filter that narrows a query to `scope`. */
function scoped(scope: PosthogScope): PropertyFilter[] {
  return scope === null
    ? []
    : [{ key: scope.property, value: scope.id, operator: "exact", type: "event" }];
}

/** The events node of `match`. */
function eventsNode(match: AnalyticsEventMatch): Record<string, Json> {
  const properties: PropertyFilter[] = Object.entries(match.where ?? {}).map(([key, value]) => ({
    key,
    value: Array.isArray(value) ? [...(value as readonly Json[])] : (value as Json),
    operator: "exact",
    type: "event",
  }));
  return { kind: "EventsNode", event: match.event, name: match.event, properties };
}

/** A retention entity of `event`. */
function entity(event: string): Json {
  return { id: event, name: event, type: "events" };
}

/**
 * The PostHog query of `call`, narrowed to `scope`.
 *
 * @param call - a checked product analytics call.
 * @param scope - the event property and scope id to narrow to; null for none.
 * @example
 * posthogQueryOf({ kind: "cohort", query: { match: { event: "order_placed" }, period: "month", range } }, { property: "scope_id", id: "org_1" });
 */
export function posthogQueryOf(call: ProductAnalyticsCall, scope: PosthogScope): Json {
  const common = { properties: scoped(scope), filterTestAccounts: false };
  switch (call.kind) {
    case "funnel": {
      return {
        kind: "FunnelsQuery",
        series: call.query.steps.map(eventsNode),
        dateRange: dateRange(call.query.range),
        funnelsFilter: {
          funnelWindowInterval: call.query.windowDays ?? WINDOW_DAYS,
          funnelWindowIntervalUnit: "day",
          funnelOrderType: "ordered",
          funnelVizType: "steps",
        },
        ...common,
      };
    }
    case "retention": {
      return {
        kind: "RetentionQuery",
        retentionFilter: {
          targetEntity: entity(call.query.startEvent),
          returningEntity: entity(call.query.returnEvent),
          period: PERIOD[call.query.period],
          totalIntervals: call.query.intervals + 1,
          retentionType:
            call.query.recurring === true ? "retention_recurring" : "retention_first_time",
        },
        dateRange: dateRange(call.query.range),
        ...common,
      };
    }
    case "cohort": {
      return {
        kind: "TrendsQuery",
        series: [{ ...eventsNode(call.query.match), math: "dau" }],
        interval: call.query.period,
        dateRange: dateRange(call.query.range),
        ...common,
      };
    }
  }
}
