/**
 * Stackra file contract:
 * Purpose: unit tests of `posthogQueryOf`: each call becomes the structured PostHog query node with the caller's values
 *          as JSON values, the scope as a top-level exact event filter (none when the scope is null), the default
 *          14-day funnel window, PostHog's period names and the period-0 interval.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0163 (decision 5 as amended 2026-10-28); ADR 0160; ADR 0323.
 */
import { describe, expect, it } from "@stackra/testing";

import { RetentionPeriod } from "#contracts/enums/retention-period.enum";
import { posthogQueryOf } from "#node/functions/posthog-query-of.function";

const range = { from: "2026-10-01", to: "2026-10-28" };
const scope = { property: "scope_id", id: "org_1" };
const scopeFilter = [{ key: "scope_id", value: "org_1", operator: "exact", type: "event" }];
const dateRange = { date_from: "2026-10-01", date_to: "2026-10-28", explicitDate: true };

describe(posthogQueryOf, () => {
  it("builds an ordered funnel narrowed to the scope", () => {
    const steps = [
      { event: "cart_viewed", where: { channel: ["web", "app"] } },
      { event: "order_placed" },
    ];
    expect(posthogQueryOf({ kind: "funnel", query: { steps, range } }, scope)).toEqual({
      kind: "FunnelsQuery",
      series: [
        {
          kind: "EventsNode",
          event: "cart_viewed",
          name: "cart_viewed",
          properties: [{ key: "channel", value: ["web", "app"], operator: "exact", type: "event" }],
        },
        { kind: "EventsNode", event: "order_placed", name: "order_placed", properties: [] },
      ],
      dateRange,
      funnelsFilter: {
        funnelWindowInterval: 14,
        funnelWindowIntervalUnit: "day",
        funnelOrderType: "ordered",
        funnelVizType: "steps",
      },
      properties: scopeFilter,
      filterTestAccounts: false,
    });
  });

  it("asks retention for period 0 plus the intervals, first-time by default, unscoped when the scope is null", () => {
    const query = {
      startEvent: "signed_up",
      returnEvent: "order_placed",
      period: RetentionPeriod.Week,
      intervals: 8,
      range,
    };
    expect(posthogQueryOf({ kind: "retention", query }, null)).toMatchObject({
      kind: "RetentionQuery",
      retentionFilter: {
        targetEntity: { id: "signed_up", name: "signed_up", type: "events" },
        returningEntity: { id: "order_placed", name: "order_placed", type: "events" },
        period: "Week",
        totalIntervals: 9,
        retentionType: "retention_first_time",
      },
      dateRange,
      properties: [],
    });
    expect(
      posthogQueryOf(
        { kind: "retention", query: { ...query, period: RetentionPeriod.Day, recurring: true } },
        scope,
      ),
    ).toMatchObject({
      retentionFilter: { retentionType: "retention_recurring", period: "Day" },
      properties: scopeFilter,
    });
  });

  it("counts a cohort's distinct people per period", () => {
    const query = { match: { event: "order_placed" }, period: RetentionPeriod.Month, range };
    expect(posthogQueryOf({ kind: "cohort", query }, scope)).toEqual({
      kind: "TrendsQuery",
      series: [
        {
          kind: "EventsNode",
          event: "order_placed",
          name: "order_placed",
          properties: [],
          math: "dau",
        },
      ],
      interval: "month",
      dateRange,
      properties: scopeFilter,
      filterTestAccounts: false,
    });
  });
});
