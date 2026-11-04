/**
 * Stackra file contract:
 * Purpose: `useDateTimeField(name, label)`, an instant form field entered as a day, an hour and a minute in the viewer's
 *          own time zone and held as the UTC ISO 8601 string (`2026-11-01T06:30:00.000Z`) every instant schema accepts,
 *          as the props its parts take: the binding, the section (its title and the zone's name), the day picker and
 *          the hour and minute number fields.
 * Boundary: platform-free: imports `react` and `@stackra/ui/form`'s binding and no UI kit; the web and native form fields
 *           spread the props on their own kit's parts. The parts live here: a day without its time yet is not an
 *           instant; an empty time is the start of the day.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (form keys are paths of the input); ADR 0055 (thin field adapters).
 */
import { CalendarDate } from "@internationalized/date";
import { useTranslation } from "@stackra/i18n/react";
import type { FormFieldBinding } from "@stackra/ui/contracts";
import { useSchemaField } from "@stackra/ui/form";
import { useState } from "react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";

/** The parts of an instant being entered. */
type Parts = {
  readonly day: CalendarDate | null;
  readonly hour: number | null;
  readonly minute: number | null;
};

/** A labelled number part of the time. */
type TimePart = {
  readonly label: string;
  readonly minValue: number;
  readonly maxValue: number;
  readonly value: number | null;
  readonly onChange: (next: number | null) => void;
};

/** The instant a Date or an ISO 8601 string holds, or undefined. */
function instantOf(value: unknown): Date | undefined {
  const instant =
    value instanceof Date ? value : typeof value === "string" ? new Date(value) : undefined;
  return instant === undefined || Number.isNaN(instant.getTime()) ? undefined : instant;
}

/**
 * The parts of the instant at `name`.
 *
 * @example
 * const { field, section, day, hour, minute } = useDateTimeField("startsAt", "Starts at");
 */
export function useDateTimeField(
  name: string,
  label: string,
): {
  readonly field: FormFieldBinding<Date | string | null | undefined>;
  readonly section: { readonly title: string; readonly description: string };
  readonly day: {
    readonly label: string;
    readonly value: CalendarDate | null;
    readonly onChange: (day: CalendarDate | null) => void;
  };
  readonly hour: TimePart;
  readonly minute: TimePart;
} {
  const { t } = useTranslation();
  const field = useSchemaField<Date | string | null | undefined>(name);
  const [parts, setParts] = useState<Parts>(() => {
    const instant = instantOf(field.value);
    return {
      day:
        instant === undefined
          ? null
          : new CalendarDate(instant.getFullYear(), instant.getMonth() + 1, instant.getDate()),
      hour: instant?.getHours() ?? null,
      minute: instant?.getMinutes() ?? null,
    };
  });
  const change = (next: Parts) => {
    setParts(next);
    const { day, hour, minute } = next;
    // `new Date(y, m, d, h, min)` reads the parts in the viewer's time zone; an empty time is the start of the day.
    field.onChange?.(
      day === null
        ? undefined
        : new Date(day.year, day.month - 1, day.day, hour ?? 0, minute ?? 0).toISOString(),
    );
  };
  const zone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
  return {
    field,
    section: { title: label, description: t(PANEL_KEYS.panel.resources.time_zone, { zone }) },
    day: {
      label: t(PANEL_KEYS.panel.resources.date_part),
      value: parts.day,
      onChange: (day) => change({ ...parts, day }),
    },
    hour: {
      label: t(PANEL_KEYS.panel.resources.hour),
      minValue: 0,
      maxValue: 23,
      value: parts.hour,
      onChange: (hour) => change({ ...parts, hour: Number.isNaN(hour) ? null : hour }),
    },
    minute: {
      label: t(PANEL_KEYS.panel.resources.minute),
      minValue: 0,
      maxValue: 59,
      value: parts.minute,
      onChange: (minute) => change({ ...parts, minute: Number.isNaN(minute) ? null : minute }),
    },
  };
}
