/**
 * Stackra file contract:
 * Purpose: `CountMetric`, the metric shape of a count a query reports (`orders!: CountMetric`): its value, the value of
 *          the previous period, the per-bucket series and the target, so the KPI's format, trend, sparkline and
 *          target come from the type. `CountMetric.from(count, { series, target })` builds one from a
 *          `CrudService.metrics()` aggregate.
 * Boundary: a shape class; it registers this package's own schema for itself when the module loads, so `create`,
 *           `from` and `validate` work with no generated file. The query computes every number; the panel presents.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 15 and 16: metric shapes live in the core entry; the query computes); ADR 0294
 *                     (decisions 4 and 26).
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";

import { COUNT_METRIC_SCHEMA } from "#core/constants/count-metric-schema.constant";
import type { MetricValue } from "#core/types/metric-value.type";

/**
 * A counted metric.
 *
 * @example
 * return OrderKpisOutput.create({ orders: CountMetric.from(await paid.count(), { series: countSeries.current }) });
 */
export class CountMetric extends Schema {
  /** The shipped schema, for a generated output schema that holds a count metric. */
  static readonly schema = COUNT_METRIC_SCHEMA;

  /** The count over the period; null when there is nothing to count yet. */
  @Int()
  value!: number | null;

  /** The count over the period before it; null without a comparison. */
  @Int()
  previous!: number | null;

  /** One count per bucket of the period, oldest first; null without a series. */
  @Int({ each: true })
  series!: number[] | null;

  /** The target over the period; null without one. */
  @Int()
  target!: number | null;

  /**
   * A count metric from a current and previous aggregate.
   *
   * @param count - the aggregate over the period and the period before it.
   * @param options - the per-bucket series and the target, both absent by default.
   * @throws ZodError when a value is not a whole number.
   */
  static from(
    count: MetricValue,
    options: { readonly series?: readonly number[] | null; readonly target?: number | null } = {},
  ): CountMetric {
    return CountMetric.create({
      value: count.current,
      previous: count.previous,
      series: options.series === undefined || options.series === null ? null : [...options.series],
      target: options.target ?? null,
    });
  }
}

registerSchemas([[CountMetric, COUNT_METRIC_SCHEMA]]);
