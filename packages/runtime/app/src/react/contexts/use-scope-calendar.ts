/**
 * Stackra file contract:
 * Purpose: `useScopeCalendar()`, the calendar the running scope (the tenant) shows dates in: its
 *          `DisplaySettings.calendar`, read through the container's `SettingsReader`, so every app's dates follow the
 *          tenant's choice with no wiring of its own.
 * Boundary: Gregorian until the read answers, and for good where the container binds no `SettingsReader` or the read
 *           fails: a date always renders. Not exported; `I18nMount` passes it to `I18nProvider`.
 * Runtime: isomorphic
 * Governing contract: ADR 0192 (decision 3); ADR 0295 (decision 10); ADR 0307 (rule 23).
 */
import { useContainer } from "@stackra/container/react";
import { CalendarSystem } from "@stackra/i18n";
import { DisplaySettings, SettingsReader } from "@stackra/settings";
import { useEffect, useState } from "react";

/**
 * The running scope's calendar.
 *
 * @example
 * const calendar = useScopeCalendar(); // "islamic-umalqura" once a Hijri tenant's settings load
 */
export function useScopeCalendar(): CalendarSystem {
  const container = useContainer();
  const [calendar, setCalendar] = useState<CalendarSystem>(CalendarSystem.Gregory);

  useEffect(() => {
    if (!container.has(SettingsReader)) return;
    let live = true;
    container
      .get(SettingsReader)
      .get(DisplaySettings)
      .then(
        (settings) => {
          if (live) setCalendar(settings.calendar);
        },
        // why: a failed read keeps Gregorian; dates never fail to render
        () => undefined,
      );
    return () => {
      live = false;
    };
  }, [container]);

  return calendar;
}
