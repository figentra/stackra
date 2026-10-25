/**
 * Stackra file contract:
 * Purpose: `TimeRangeInput`, the base of a query input that reports on a period (`class OrderKpisInput extends
 *          TimeRangeInput {}`): the named range, the custom `from` and `to`, and whether the answer carries the
 *          previous period, so a widget's picker and a dashboard's one range picker drive it.
 * Boundary: a shape class; it registers this package's own schema for itself when the module loads. Its fields match
 *           `@stackra/actions`' `PeriodInput`, so the query reads its window with `ctx.period(input)`; the scope and
 *           its time zone come from the context, never from the input.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 14, 16 and 20); ADR 0294 (decisions 4 and 26).
 */
import { registerSchemas, Schema } from "@stackra/validation";

import { TIME_RANGE_INPUT_SCHEMA } from "#core/constants/time-range-input-schema.constant";
import { TimeRange } from "#core/enums/time-range.enum";

/**
 * The period a query reports on.
 *
 * @example
 * export class OrderKpisInput extends TimeRangeInput {}
 * await run(OrderKpisQuery, { range: TimeRange.Last7Days });
 */
export class TimeRangeInput extends Schema {
  /** The named period; `custom` reads `from` and `to`. */
  range: TimeRange = TimeRange.Today;

  /** The start of a custom period, inclusive. */
  from?: Date;

  /** The end of a custom period, exclusive; the call's instant when absent. */
  to?: Date;

  /** Whether the answer carries the period before it, for the trend. */
  compare = true;
}

registerSchemas([[TimeRangeInput, TIME_RANGE_INPUT_SCHEMA]]);
