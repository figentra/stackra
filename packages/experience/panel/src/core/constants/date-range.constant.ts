/**
 * Stackra file contract:
 * Purpose: `DateRange`, the relative or fixed date values a view filter or a drill holds for a date field
 *          (`paidAt: DateRange.today()`).
 * Boundary: pure: a relative value is its `TimeRange` code, read against the viewer's clock and time zone when the view
 *           opens; `between` is a fixed window.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 9 and 15).
 */
import { TimeRange } from "#core/enums/time-range.enum";

/**
 * Date filter values.
 *
 * @example
 * v.view("paid_today", { status: [OrderStatus.Paid], paidAt: DateRange.today() });
 */
export const DateRange = Object.freeze({
  /** Today. */
  today: (): TimeRange => TimeRange.Today,

  /** Yesterday. */
  yesterday: (): TimeRange => TimeRange.Yesterday,

  /** Today and the six days before it. */
  last7Days: (): TimeRange => TimeRange.Last7Days,

  /** Today and the 29 days before it. */
  last30Days: (): TimeRange => TimeRange.Last30Days,

  /** This calendar month. */
  thisMonth: (): TimeRange => TimeRange.ThisMonth,

  /** From `from` (inclusive) to `to` (exclusive). */
  between: (from: Date, to: Date): { readonly from: Date; readonly to: Date } =>
    Object.freeze({ from, to }),
});
