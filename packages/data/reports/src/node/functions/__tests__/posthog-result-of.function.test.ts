/**
 * Stackra file contract:
 * Purpose: unit tests of `posthogResultOf`: PostHog replies become counts per step, cohort and period (conversion over
 *          the first step, no median on the first step, day-only dates, a breakdown-nested funnel read from its first
 *          group, an empty trend as no buckets), and a reply of another shape is refused as unavailable rather than
 *          read as zero.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0163 (decision 5 as amended 2026-10-28).
 */
import { describe, expect, it } from "@stackra/testing";

import { RetentionPeriod } from "#contracts/enums/retention-period.enum";
import { ProductAnalyticsUnavailableError } from "#node/errors/product-analytics-unavailable.error";
import { posthogResultOf } from "#node/functions/posthog-result-of.function";

const range = { from: "2026-10-01", to: "2026-10-28" };
const funnel = {
  kind: "funnel",
  query: { steps: [{ event: "cart_viewed" }, { event: "order_placed" }], range },
} as const;
const retention = {
  kind: "retention",
  query: {
    startEvent: "signed_up",
    returnEvent: "order_placed",
    period: RetentionPeriod.Week,
    intervals: 1,
    range,
  },
} as const;
const cohort = {
  kind: "cohort",
  query: { match: { event: "order_placed" }, period: RetentionPeriod.Month, range },
} as const;

describe(posthogResultOf, () => {
  it("reads people, conversion and the median per funnel step", () => {
    const steps = [
      { count: 10, median_conversion_time: null },
      { count: 4, median_conversion_time: 90 },
    ];
    const expected = {
      steps: [
        { event: "cart_viewed", people: 10, conversion: 1, medianSeconds: null },
        { event: "order_placed", people: 4, conversion: 0.4, medianSeconds: 90 },
      ],
    };
    expect(posthogResultOf(funnel, { results: steps })).toEqual(expected);
    expect(posthogResultOf(funnel, { results: [steps] })).toEqual(expected);
  });

  it("gives zero conversion when nobody entered and refuses another step count", () => {
    expect(
      posthogResultOf(funnel, { results: [{ count: 0 }, { count: 0 }] }).steps.map(
        (step) => step.conversion,
      ),
    ).toEqual([0, 0]);
    expect(() => posthogResultOf(funnel, { results: [{ count: 1 }] })).toThrow(
      ProductAnalyticsUnavailableError,
    );
    expect(() => posthogResultOf(funnel, { error: "x" })).toThrow(ProductAnalyticsUnavailableError);
  });

  it("reads one retention row per cohort and refuses a row with no values or a bad count", () => {
    expect(
      posthogResultOf(retention, {
        results: [
          { date: "2026-10-05T00:00:00Z", label: "Week 0", values: [{ count: 10 }, { count: 4 }] },
        ],
      }),
    ).toEqual({ period: "week", cohorts: [{ start: "2026-10-05", size: 10, retained: [10, 4] }] });
    expect(() => posthogResultOf(retention, { results: [{ date: "2026-10-05" }] })).toThrow(
      ProductAnalyticsUnavailableError,
    );
    expect(() =>
      posthogResultOf(retention, { results: [{ date: "2026-10-05", values: [{ count: -1 }] }] }),
    ).toThrow(ProductAnalyticsUnavailableError);
  });

  it("reads a cohort's distinct people per period, no buckets from an empty trend, and refuses a mismatch", () => {
    expect(
      posthogResultOf(cohort, { results: [{ data: [3, 5], days: ["2026-09-01", "2026-10-01"] }] }),
    ).toEqual({
      period: "month",
      buckets: [
        { start: "2026-09-01", people: 3 },
        { start: "2026-10-01", people: 5 },
      ],
    });
    expect(posthogResultOf(cohort, { results: [] })).toEqual({ period: "month", buckets: [] });
    expect(() => posthogResultOf(cohort, { results: [{ data: [1], days: [] }] })).toThrow(
      ProductAnalyticsUnavailableError,
    );
  });
});
