/**
 * Stackra file contract:
 * Purpose: `weekStartOf`, the first day of the week in a locale as 0 (Sunday) to 6 (Saturday), from `Intl.Locale`'s
 *          week info where the runtime has it, else Sunday for Arabic and English and Monday elsewhere.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (Arabic); STA-1371.
 */

/** The week info a runtime may expose, as a method (newer) or a property (older). */
type WeekInfo = { readonly firstDay?: number };

/**
 * The first weekday of `locale`.
 * @example weekStartOf("de"); // 1
 */
export function weekStartOf(locale: string): number {
  try {
    const tag = new Intl.Locale(locale) as Intl.Locale & {
      getWeekInfo?: () => WeekInfo;
      weekInfo?: WeekInfo;
    };
    // `firstDay` counts 1 (Monday) to 7 (Sunday).
    const firstDay = tag.getWeekInfo?.().firstDay ?? tag.weekInfo?.firstDay;
    if (typeof firstDay === "number") return firstDay % 7;
  } catch {
    // An unknown tag falls through to the language default.
  }
  return /^(ar|en)\b/.test(locale) ? 0 : 1;
}
