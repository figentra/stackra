/**
 * Stackra file contract:
 * Purpose: `PercentMetric`, the metric shape of a rate a query reports (`deliveredRate!: PercentMetric`): a ratio
 *          (0.67 is 67%) for the value, the previous period, the per-bucket series and the target, so the KPI shows a
 *          percent in the reader's locale and its trend in percentage points. `PercentMetric.from(ratio, { series,
 *          target })` builds one from a ratio the query computed.
 * Boundary: a shape class; it registers this package's own schema for itself when the module loads. The query computes
 *           every ratio; the panel presents. The `format` mark travels on the wire because the renderers read the
 *           answer, not the type.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 15 and 16: metric shapes live in the core entry; the query computes); ADR 0294
 *                     (decisions 4 and 26).
 */
import { Num, registerSchemas, Schema } from "@stackra/validation";

import { PERCENT_METRIC_SCHEMA } from "#core/constants/percent-metric-schema.constant";
import { MetricFormat } from "#core/enums/metric-format.enum";
import type { MetricValue } from "#core/types/metric-value.type";

/**
 * A rate metric, as a ratio.
 *
 * @example
 * return ShipmentKpisOutput.create({ deliveredRate: PercentMetric.from({ current: 0.67, previous: 0.6 }) });
 */
export class PercentMetric extends Schema {
  /** The shipped schema, for a generated output schema that holds a percent metric. */
  static readonly schema = PERCENT_METRIC_SCHEMA;

  /** The ratio over the period (0.67 is 67%); null when there is nothing to measure yet. */
  @Num
  value!: number | null;

  /** The ratio over the period before it; null without a comparison. */
  @Num
  previous!: number | null;

  /** One ratio per bucket of the period, oldest first; null without a series. */
  @Num({ each: true })
  series!: number[] | null;

  /** The target ratio over the period; null without one. */
  @Num
  target!: number | null;

  /** Marks the metric as a percent, so a renderer formats it from the answer alone. */
  format!: MetricFormat;

  /**
   * A percent metric from a current and previous ratio.
   *
   * @param ratio - the ratio over the period and the period before it.
   * @param options - the per-bucket series and the target, both absent by default.
   * @throws ZodError when a ratio is not a finite number.
   */
  static from(
    ratio: MetricValue,
    options: { readonly series?: readonly number[] | null; readonly target?: number | null } = {},
  ): PercentMetric {
    return PercentMetric.create({
      value: ratio.current,
      previous: ratio.previous,
      series: options.series === undefined || options.series === null ? null : [...options.series],
      target: options.target ?? null,
      format: MetricFormat.Percent,
    });
  }
}

registerSchemas([[PercentMetric, PERCENT_METRIC_SCHEMA]]);
