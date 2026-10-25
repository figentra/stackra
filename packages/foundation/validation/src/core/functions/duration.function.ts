/**
 * Stackra file contract:
 * Purpose: `duration(text)`, the `Duration` value generated defaults write for a `Duration.*` initializer
 *          (`.default(duration("60s"))`): a short form (`"500ms"`, `"60s"`, `"5m"`, `"1h"`, `"2d"`) or an ISO 8601
 *          duration, read into the canonical `Duration`.
 * Boundary: a pure function over the contracts `Duration`, so `duration("60s") === Duration.seconds(60)`. It builds a
 *           value, not a field schema. Authored code writes `Duration.seconds(60)` instead.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: `Duration.*` is a constant gen evaluates in defaults).
 */
import { Duration } from "@stackra/contracts";

/** A number and one unit. */
const SHORT = /^(\d+(?:\.\d+)?)(ms|s|m|h|d)$/;

/** The constructor of each short unit. */
const UNITS = {
  ms: (amount: number) => Duration.seconds(amount / 1000),
  s: Duration.seconds,
  m: Duration.minutes,
  h: Duration.hours,
  d: Duration.days,
} as const;

/**
 * The `Duration` that `text` spells.
 *
 * @throws RangeError when `text` is neither a short form nor an ISO 8601 duration of days, hours, minutes and seconds.
 * @example
 * duration("60s"); // "PT1M"
 * duration("PT600S"); // "PT10M"
 */
export function duration(text: string): Duration {
  const match = SHORT.exec(text);
  if (match !== null) {
    const [, amount, unit] = match as unknown as [string, string, keyof typeof UNITS];
    return UNITS[unit](Number(amount));
  }
  try {
    return Duration.parse(text);
  } catch {
    throw new RangeError(
      `"${text}" is not a duration: write a number and ms, s, m, h or d ("60s"), or ISO 8601 ("PT1M")`,
    );
  }
}
