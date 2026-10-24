/**
 * Stackra file contract:
 * Purpose: `PeriodInput`, what `ctx.period(input)` reads from a query's input: a named range (`today`,
 *          `last_7_days`, `last_30_days`, `this_month`) or a custom `from` and `to`.
 * Boundary: a type only, written structurally so the panel's `TimeRangeInput` (its `range`, `from`, `to`) satisfies it
 *           without this package importing the panel. Other fields of the input are ignored.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (metrics over a time range); ADR 0136 (decision 1: the context carries the time zone).
 */

/** The period fields of a query input. */
export interface PeriodInput {
  /** A named range code; wins over `from` and `to` when set. */
  readonly range?: string | null;

  /** The start of a custom period, inclusive. */
  readonly from?: Date | null;

  /** The end of a custom period, exclusive; the call's instant when absent. */
  readonly to?: Date | null;
}
