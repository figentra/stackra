/**
 * Stackra file contract:
 * Purpose: `CalendarLocale`, the wrapper that shows the date pickers below it in another calendar (the Hijri
 *          calendar for `islamic-umalqura`) by giving React Aria the locale with a `-u-ca-` keyword.
 * Boundary: internal; Gregorian draws its children as they are. The values stay Gregorian (`toGregorian`).
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (Hijri option, owner approval 2026-10-28); ADR 0192 (decision 3).
 */
import type { ReactElement, ReactNode } from "react";
import { I18nProvider, useLocale } from "react-aria-components";

import type { CalendarSystem } from "#contracts/enums/calendar-system.enum";
import { calendarLocaleOf } from "#core/functions/calendar-locale-of.function";

/** Shows the pickers below it in `calendar`. */
export function CalendarLocale({
  calendar = "gregory",
  children,
}: {
  readonly calendar?: CalendarSystem | undefined;
  readonly children: ReactNode;
}): ReactElement {
  const { locale } = useLocale();
  if (calendar === "gregory") return <>{children}</>;
  return <I18nProvider locale={calendarLocaleOf(locale, calendar)}>{children}</I18nProvider>;
}
