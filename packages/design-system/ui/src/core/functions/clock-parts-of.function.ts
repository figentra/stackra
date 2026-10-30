/**
 * Stackra file contract:
 * Purpose: `clockPartsOf(ms)`, a duration in milliseconds as whole days, hours, minutes and seconds; a negative
 *          duration is zero.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: STA-1371 (wave A).
 */
import type { ClockParts } from "#core/types/clock-parts.type";

/** The parts of `ms`. */
export function clockPartsOf(ms: number): ClockParts {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}
