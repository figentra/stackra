/**
 * Stackra file contract:
 * Purpose: `LocaleFormat`, the calendar and clock conventions of one locale that Intl alone does not settle the same
 *          way in every engine: the first day of the week and the hour cycle.
 * Boundary: a type only. The defaults are the `Locale`'s case data; `I18nConfig.formats` (dashboard-editable
 *           configuration) overrides them per locale, and `localeFormat` merges the two. Decimal and grouping
 *           separators are not here: Intl gives them from the locale tag (comma decimal in fr, de, es, it and nl).
 * Runtime: isomorphic
 * Governing contract: ADR 0403 (seven languages: formats per locale); owner principle 2026-10-25 (configuration, not
 *                     code).
 */
import type { HourCycle } from "#core/enums/hour-cycle.enum";

/** One locale's week start and clock. */
export interface LocaleFormat {
  /** The first day of the week, ISO 8601 numbering: 1 Monday to 7 Sunday (6 is Saturday). */
  readonly weekStart: number;

  /** The clock times are shown on. */
  readonly hourCycle: HourCycle;
}
