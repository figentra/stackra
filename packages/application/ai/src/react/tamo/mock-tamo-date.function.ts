/**
 * Stackra file contract:
 * Purpose: `mockTamoDate`, the offline mock's natural-language dates: today, tomorrow, yesterday, next or last weekday, in N
 *          days or weeks, this, last or next week or month, in English and Arabic.
 * Boundary: demo only, deterministic from `today`; anything else is `null` (nothing proposed).
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (natural-language dates; a deterministic mock).
 */
import type { TamoTasks } from "@stackra/ui/contracts";

/** The weekdays, Sunday first, in English and Arabic. */
const WEEKDAYS: readonly (readonly [string, string])[] = [
  ["sunday", "الأحد"],
  ["monday", "الاثنين"],
  ["tuesday", "الثلاثاء"],
  ["wednesday", "الأربعاء"],
  ["thursday", "الخميس"],
  ["friday", "الجمعة"],
  ["saturday", "السبت"],
];

/** A UTC date as an ISO day. */
const iso = (date: Date) => date.toISOString().slice(0, 10);
/** `date` plus `days`. */
const plus = (date: Date, days: number) => new Date(date.getTime() + days * 86_400_000);

/** A day or range from words, counted from `today`. */
export function mockTamoDate(input: TamoTasks["date"]["input"]): TamoTasks["date"]["output"] {
  const text = input.text.trim().toLowerCase();
  const today = new Date(`${input.today}T00:00:00Z`);
  const day = (date: Date) =>
    input.isRange ? { start: iso(date), end: iso(date) } : { start: iso(date) };
  const range = (start: Date, end: Date) =>
    input.isRange ? { start: iso(start), end: iso(end) } : { start: iso(start) };
  const monthOf = (offset: number) => {
    const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + offset, 1));
    const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + offset + 1, 0));
    return range(start, end);
  };
  const weekOf = (offset: number) => {
    const start = plus(today, -today.getUTCDay() + offset * 7);
    return range(start, plus(start, 6));
  };
  if (/^(today|اليوم)$/u.test(text)) return day(today);
  if (/^(tomorrow|غدًا|غدا)$/u.test(text)) return day(plus(today, 1));
  if (/^(yesterday|أمس|الأمس)$/u.test(text)) return day(plus(today, -1));
  if (/(last|previous) month|الشهر الماضي/u.test(text)) return monthOf(-1);
  if (/this month|هذا الشهر/u.test(text)) return monthOf(0);
  if (/next month|الشهر القادم/u.test(text)) return monthOf(1);
  if (/(last|previous) week|الأسبوع الماضي/u.test(text)) return weekOf(-1);
  if (/this week|هذا الأسبوع/u.test(text)) return weekOf(0);
  if (/next week|الأسبوع القادم/u.test(text)) return weekOf(1);
  const inDays = /in (\d+) (day|week)s?|بعد (\d+) (يوم|أيام|أسبوع|أسابيع)/u.exec(text);
  if (inDays) {
    const count = Number(inDays[1] ?? inDays[3]);
    const isWeeks = /week|أسبوع|أسابيع/u.test(inDays[0]);
    return day(plus(today, count * (isWeeks ? 7 : 1)));
  }
  const weekday = WEEKDAYS.findIndex(([en, ar]) => text.includes(en) || text.includes(ar));
  if (weekday >= 0) {
    const isLast = /last|previous|الماضي/u.test(text);
    const ahead = (weekday - today.getUTCDay() + 7) % 7 || 7;
    return day(plus(today, isLast ? ahead - 7 : ahead));
  }
  return null;
}
