/**
 * Stackra file contract:
 * Purpose: `hourCycleOf(locale)`, whether `locale` counts hours to 12 or to 24, as Intl says.
 * Boundary: pure; 24 when Intl cannot tell.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28).
 */
import type { HourCycle } from "#contracts/enums/hour-cycle.enum";

/**
 * The locale's hour cycle.
 * @param locale - a BCP 47 tag
 * @returns 12 or 24
 */
export function hourCycleOf(locale: string): HourCycle {
  const cycle = new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hourCycle;
  return cycle === "h11" || cycle === "h12" ? 12 : 24;
}
