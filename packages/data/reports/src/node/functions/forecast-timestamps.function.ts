/**
 * Stackra file contract:
 * Purpose: `forecastTimestamps`, the next `count` timestamps after `last` at a forecast frequency, as ISO 8601 strings
 *          without a zone suffix (`2026-11-01T00:00:00`, the form the forecast image returns).
 * Boundary: pure; UTC arithmetic. A month steps by calendar month.
 * Runtime: isomorphic
 * Governing contract: ADR 0492 (decision 8).
 */
import type { ForecastFrequency } from "#contracts/types/forecast-frequency.type";

/** Milliseconds per fixed step. */
const STEP_MS = { H: 3_600_000, D: 86_400_000, W: 604_800_000 } as const;

/** A timestamp with a time but no zone is read as UTC. */
const HAS_ZONE = /(Z|[+-]\d\d:?\d\d)$/;

/**
 * The `count` steps after `last`.
 *
 * @throws RangeError when `last` is not a date.
 * @example
 * forecastTimestamps("2026-10-30", "D", 2); // ["2026-10-31T00:00:00", "2026-11-01T00:00:00"]
 */
export function forecastTimestamps(
  last: string,
  frequency: ForecastFrequency,
  count: number,
): string[] {
  const start = new Date(last.includes("T") && !HAS_ZONE.test(last) ? `${last}Z` : last);
  if (Number.isNaN(start.getTime())) throw new RangeError("the last timestamp is not a date");
  return Array.from({ length: count }, (_, index) => {
    const step = index + 1;
    const next = new Date(start);
    if (frequency === "M") next.setUTCMonth(next.getUTCMonth() + step);
    else next.setTime(start.getTime() + step * STEP_MS[frequency]);
    return next.toISOString().slice(0, 19);
  });
}
