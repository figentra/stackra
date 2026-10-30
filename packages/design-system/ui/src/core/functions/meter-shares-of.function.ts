/**
 * Stackra file contract:
 * Purpose: `meterSharesOf`, each segment's share of a stacked meter's whole (the segments' sum unless `max` is
 *          larger), and what is left free.
 * Boundary: pure; shares are fractions that never add up past 1; negative values count as zero.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: the same numbers on web and native); STA-1371.
 */
import type { MeterSegment } from "#contracts/types/meter-segment.type";

/** The shares of a stacked meter. */
export function meterSharesOf(
  segments: readonly MeterSegment[],
  max?: number,
): { readonly shares: readonly number[]; readonly free: number; readonly total: number } {
  const values = segments.map((segment) => Math.max(0, segment.value));
  const sum = values.reduce((total, value) => total + value, 0);
  const whole = Math.max(sum, max ?? 0);
  if (whole === 0) return { shares: values.map(() => 0), free: 0, total: 0 };
  const shares = values.map((value) => value / whole);
  return { shares, free: (whole - sum) / whole, total: sum };
}
