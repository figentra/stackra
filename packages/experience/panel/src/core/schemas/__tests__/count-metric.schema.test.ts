/**
 * Stackra file contract:
 * Purpose: unit tests of `CountMetric`: `from` builds a metric from a current and previous aggregate with its series and
 *          target, the shipped schema is its `schema`, and a fractional count is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 15 and 16).
 */
import { schemaOf } from "@stackra/validation";
import { describe, expect, it } from "@stackra/testing";

import { COUNT_METRIC_SCHEMA } from "#core/constants/count-metric-schema.constant";
import { CountMetric } from "#core/schemas/count-metric.schema";

describe("CountMetric", () => {
  it("builds from an aggregate", () => {
    const metric = CountMetric.from({ current: 2, previous: 1 }, { series: [0, 2] });
    expect(metric).toBeInstanceOf(CountMetric);
    expect(metric).toMatchObject({ value: 2, previous: 1, series: [0, 2], target: null });
    expect(CountMetric.from({ current: 3, previous: 0 })).toMatchObject({
      series: null,
      target: null,
    });
  });

  it("carries and registers its shipped schema", () => {
    expect(CountMetric.schema).toBe(COUNT_METRIC_SCHEMA);
    expect(schemaOf(CountMetric)).toBe(COUNT_METRIC_SCHEMA);
  });

  it("refuses a fractional count", () => {
    expect(() => CountMetric.from({ current: 1.5, previous: 1 })).toThrow();
  });
});
