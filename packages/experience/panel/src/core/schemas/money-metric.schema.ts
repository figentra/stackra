/**
 * Stackra file contract:
 * Purpose: `MoneyMetric`, the metric shape of an amount a query reports (`revenue!: MoneyMetric`): minor units for the
 *          value, the previous period, the per-bucket series and the target, all in one currency, so the KPI's format,
 *          currency, trend, sparkline and target come from the type. `MoneyMetric.from(sum, { currency, series,
 *          target })` builds one from a `CrudService.metrics()` sum.
 * Boundary: a shape class; it registers this package's own schema for itself when the module loads. A money metric
 *           never mixes currencies: the query sums in one reporting currency (the metrics reader refuses a mixed sum).
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 15 and 16); ADR 0220 (money in minor units); ADR 0294 (decisions 4 and 26).
 */
import type { CurrencyCode } from "@stackra/money";
import { Int, registerSchemas, Schema } from "@stackra/validation";

import { MONEY_METRIC_SCHEMA } from "#core/constants/money-metric-schema.constant";
import type { MetricValue } from "#core/types/metric-value.type";

/**
 * An amount metric.
 *
 * @example
 * MoneyMetric.from(await paid.sum("total.minor"), { currency: ctx.currency, series: revenueSeries.current, target });
 */
export class MoneyMetric extends Schema {
  /** The shipped schema, for a generated output schema that holds a money metric. */
  static readonly schema = MONEY_METRIC_SCHEMA;

  /** The amount over the period in minor units; null when there is nothing yet. */
  @Int()
  value!: number | null;

  /** The amount over the period before it in minor units; null without a comparison. */
  @Int()
  previous!: number | null;

  /** One amount per bucket of the period in minor units, oldest first; null without a series. */
  @Int({ each: true })
  series!: number[] | null;

  /** The target over the period in minor units; null without one. */
  @Int()
  target!: number | null;

  /** The currency of every amount above. */
  currency!: CurrencyCode;

  /**
   * A money metric from a current and previous sum in `options.currency`.
   *
   * @param sum - the sum over the period and the period before it, in minor units.
   * @param options - the currency, and the per-bucket series and target, both absent by default.
   * @throws ZodError when an amount is not a whole number or the currency is not an ISO 4217 code.
   */
  static from(
    sum: MetricValue,
    options: {
      readonly currency: CurrencyCode;
      readonly series?: readonly number[] | null;
      readonly target?: number | null;
    },
  ): MoneyMetric {
    return MoneyMetric.create({
      value: sum.current,
      previous: sum.previous,
      series: options.series === undefined || options.series === null ? null : [...options.series],
      target: options.target ?? null,
      currency: options.currency,
    });
  }
}

registerSchemas([[MoneyMetric, MONEY_METRIC_SCHEMA]]);
