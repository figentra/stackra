/**
 * Stackra file contract:
 * Purpose: `recurrenceSummaryOf(rule, t, locale, numerals)`, a rule said in one sentence in the reader's language:
 *          "Every 2 weeks on Sunday and Wednesday, 10 times", "Every month on the last Friday, until 31 December 2026",
 *          "Every year on 1 Ramadan, in the Hijri calendar". Weekday, month and list words are Intl's; the numbers and
 *          the end date are in the customer's digits, the end date in the rule's calendar.
 * Boundary: pure; the sentences are `ui::recurrence_editor.*` catalogue entries, built one clause at a time.
 * Runtime: isomorphic
 * Governing contract: RFC 5545 section 3.3.10; RFC 7529; ADR 0060; ADR 0403; STA-1371.
 */
import {
  CalendarDate,
  GregorianCalendar,
  IslamicUmalquraCalendar,
  parseDate,
  toCalendar,
} from "@internationalized/date";
import { dateTimeFormatIn, formatNumber, type NumberingSystem } from "@stackra/i18n";

import type { RecurrenceRule } from "#contracts/types/recurrence-rule.type";
import { RECURRENCE_EDITOR_KEYS } from "#core/constants/recurrence-editor-keys.constant";
import { calendarLocaleOf } from "#core/functions/calendar-locale-of.function";
import { weekdayNameOf } from "#core/functions/weekday-name-of.function";
import type { CatalogueText } from "#core/types/catalogue-text.type";
import { listFormatOf } from "#core/functions/list-format-of.function";

/** The editor's keys. */
const K = RECURRENCE_EDITOR_KEYS.ui.recurrence_editor;

/**
 * Says the rule.
 * @param rule - the rule
 * @param t - the ui translator
 * @param locale - a BCP 47 tag
 * @param numerals - the customer's digits
 * @returns the sentence
 */
export function recurrenceSummaryOf(
  rule: RecurrenceRule,
  t: CatalogueText,
  locale: string,
  numerals?: NumberingSystem,
): string {
  const number = (value: number) => formatNumber(value, locale, undefined, numerals);
  const isHijri = rule.calendar === "islamic-umalqura";
  const shown = calendarLocaleOf(locale, rule.calendar);
  const interval = rule.interval ?? 1;
  let text = t(K.every_unit, { unit: rule.frequency, interval, n: number(interval) });

  const [first] = rule.weekdays ?? [];
  if (rule.frequency === "weekly" && rule.weekdays?.length) {
    const days = rule.weekdays.map((day) => weekdayNameOf(day, locale));
    text = t(K.on_days, {
      rule: text,
      days: listFormatOf(locale, { type: "conjunction" }).format(days),
    });
  } else if (rule.nth !== undefined && first) {
    text = t(K.on_nth, {
      rule: text,
      nth: String(rule.nth),
      weekday: weekdayNameOf(first, locale),
    });
  } else if (rule.frequency === "yearly" && rule.month !== undefined) {
    // Any year serves: only the month and day are written.
    const day = new CalendarDate(
      isHijri ? new IslamicUmalquraCalendar() : new GregorianCalendar(),
      isHijri ? 1447 : 2026,
      rule.month,
      Math.max(1, rule.monthDay ?? 1),
    );
    const date = dateTimeFormatIn(
      shown,
      { month: "long", day: "numeric", timeZone: "UTC" },
      numerals,
    );
    text = t(K.on_date, { rule: text, date: date.format(day.toDate("UTC")) });
  } else if (rule.monthDay === -1) {
    text = t(K.on_last_day, { rule: text });
  } else if (rule.monthDay !== undefined) {
    text = t(K.on_day, { rule: text, day: number(rule.monthDay) });
  }

  if (rule.count !== undefined) {
    text = t(K.times, { rule: text, count: rule.count, n: number(rule.count) });
  } else if (rule.until) {
    const until = toCalendar(
      parseDate(rule.until),
      isHijri ? new IslamicUmalquraCalendar() : new GregorianCalendar(),
    );
    const date = dateTimeFormatIn(shown, { dateStyle: "long", timeZone: "UTC" }, numerals);
    text = t(K.until, { rule: text, date: date.format(until.toDate("UTC")) });
  }
  return isHijri ? t(K.hijri, { rule: text }) : text;
}
