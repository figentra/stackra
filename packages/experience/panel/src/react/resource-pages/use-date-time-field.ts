/**
 * Stackra file contract:
 * Purpose: `useDateTimeField(name)`, an instant form field entered as a day, an hour and a minute in the viewer's own
 *          time zone and held as the UTC ISO 8601 string (`2026-11-01T06:30:00.000Z`) every instant schema accepts: the
 *          binding, the parts, their change and the zone's name.
 * Boundary: platform-free: imports `react` and `@stackra/ui/form`'s binding and no UI kit; the web and native form fields
 *           draw the parts with their own date picker and number fields. The parts live here: a day without its time
 *           yet is not an instant; an empty time is the start of the day.
 * Runtime: isomorphic (react)
 * Governing contract: ADR 0307 (form keys are paths of the input); ADR 0055 (thin field adapters).
 */
import { CalendarDate } from "@internationalized/date";
import type { FormFieldBinding } from "@stackra/ui/contracts";
import { useSchemaField } from "@stackra/ui/form";
import { useState } from "react";

/** The parts of an instant being entered. */
type Parts = {
  readonly day: CalendarDate | null;
  readonly hour: number | null;
  readonly minute: number | null;
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
 * const { field, parts, change, zone } = useDateTimeField("startsAt");
 */
export function useDateTimeField(name: string): {
  readonly field: FormFieldBinding<Date | string | null | undefined>;
  readonly parts: Parts;
  readonly change: (next: Parts) => void;
  readonly zone: string;
} {
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
  return { field, parts, change, zone: new Intl.DateTimeFormat().resolvedOptions().timeZone };
}
