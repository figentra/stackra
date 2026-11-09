/**
 * Stackra file contract:
 * Purpose: unit tests of `PercentMetric`: `from` builds a metric from a current and previous ratio with its series,
 *          target and `percent` mark, the shipped schema is its `schema`, and a ratio that is not a finite number or a
 *          metric without the mark is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 15 and 16).
 */
import { schemaOf } from "@stackra/validation";
import { describe, expect, it } from "@stackra/testing";

import { PERCENT_METRIC_SCHEMA } from "#core/constants/percent-metric-schema.constant";
import { PercentMetric } from "#core/schemas/percent-metric.schema";

/** The rate shape a query returns for a KPI shown as a percent. */
describe("PercentMetric", () => {
  /** A ratio keeps its fraction, and the mark is set without the caller writing it. */
  it("builds from a ratio with its series, target and percent mark", () => {
    const metric = PercentMetric.from(
      { current: 0.67, previous: 0.6 },
      { series: [0.5, 0.67], target: 0.95 },
    );
    expect(metric).toBeInstanceOf(PercentMetric);
    expect(metric).toMatchObject({
      value: 0.67,
      previous: 0.6,
      series: [0.5, 0.67],
      target: 0.95,
      format: "percent",
    });
    expect(PercentMetric.from({ current: 1, previous: 0 })).toMatchObject({
      series: null,
      target: null,
      format: "percent",
    });
  });

  /** The class and the registry hand out the one shipped schema. */
  it("carries and registers its shipped schema", () => {
    expect(PercentMetric.schema).toBe(PERCENT_METRIC_SCHEMA);
    expect(schemaOf(PercentMetric)).toBe(PERCENT_METRIC_SCHEMA);
  });

  /** NaN and infinity are not ratios, and a rate without its mark would draw as a count. */
  it("refuses a ratio that is not finite and a metric without the mark", () => {
    expect(() => PercentMetric.from({ current: Number.NaN, previous: 0.5 })).toThrow();
    expect(() =>
      PercentMetric.from({ current: Number.POSITIVE_INFINITY, previous: 0.5 }),
    ).toThrow();
    const unmarked = { value: 0.5, previous: null, series: null, target: null };
    expect(PERCENT_METRIC_SCHEMA.safeParse(unmarked).success).toBe(false);
  });
});
