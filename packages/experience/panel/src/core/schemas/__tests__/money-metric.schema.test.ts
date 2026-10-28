/**
 * Stackra file contract:
 * Purpose: unit tests of `MoneyMetric`: `from` builds a metric in one currency with its series and target, the shipped
 *          schema is its `schema`, and an unknown currency is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 15 and 16); ADR 0220.
 */
import { schemaOf } from "@stackra/validation";
import { describe, expect, it } from "@stackra/testing";

import { MONEY_METRIC_SCHEMA } from "#core/constants/money-metric-schema.constant";
import { MoneyMetric } from "#core/schemas/money-metric.schema";

describe("MoneyMetric", () => {
  it("builds from a sum in one currency", () => {
    const metric = MoneyMetric.from(
      { current: 5000, previous: 4000 },
      { currency: "USD", target: 10_000 },
    );
    expect(metric).toBeInstanceOf(MoneyMetric);
    expect(metric).toMatchObject({
      value: 5000,
      previous: 4000,
      series: null,
      target: 10_000,
      currency: "USD",
    });
  });

  it("carries and registers its shipped schema", () => {
    expect(MoneyMetric.schema).toBe(MONEY_METRIC_SCHEMA);
    expect(schemaOf(MoneyMetric)).toBe(MONEY_METRIC_SCHEMA);
  });

  it("refuses an unknown currency", () => {
    expect(() =>
      MoneyMetric.from({ current: 1, previous: 1 }, { currency: "usd" as never }),
    ).toThrow();
  });
});
