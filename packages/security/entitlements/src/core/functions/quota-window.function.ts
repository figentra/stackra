/**
 * Stackra file contract:
 * Purpose: `quotaWindow`, the window a quota counts its meter over at an instant: the start of the UTC day, month or
 *          year that holds it (inclusive) and the start of the next one (exclusive).
 * Boundary: pure: the time is a parameter. shortcut: UTC calendar periods only; anchor the window on the scope's
 *           billing date when the plan snapshot carries one.
 * Runtime: isomorphic
 * Governing contract: ADR 0216 (decisions 2 and 3: windowed meters, quotas); stackra-309.
 */
import { QuotaPeriod } from "#core/enums/quota-period.enum";

/**
 * The window of `per` that holds `at`.
 *
 * @example
 * quotaWindow(QuotaPeriod.Month, new Date("2026-10-28T09:00:00Z"));
 * // { from: 2026-10-01T00:00:00Z, to: 2026-11-01T00:00:00Z }
 */
export function quotaWindow(
  per: QuotaPeriod,
  at: Date,
): { readonly from: Date; readonly to: Date } {
  const year = at.getUTCFullYear();
  const month = at.getUTCMonth();
  const day = at.getUTCDate();
  if (per === QuotaPeriod.Day)
    return {
      from: new Date(Date.UTC(year, month, day)),
      to: new Date(Date.UTC(year, month, day + 1)),
    };
  if (per === QuotaPeriod.Month)
    return { from: new Date(Date.UTC(year, month, 1)), to: new Date(Date.UTC(year, month + 1, 1)) };
  return { from: new Date(Date.UTC(year, 0, 1)), to: new Date(Date.UTC(year + 1, 0, 1)) };
}
