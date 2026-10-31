/**
 * Stackra file contract:
 * Purpose: `useSchedulerState(props, locale, numerals)`, the state every runtime's Scheduler shares: the view and the
 *          day (each controlled or its own), previous / next / Today, the days the view holds, the time zone and now,
 *          and the words it writes: the heading, weekday and date names, hour labels and an event's time and name.
 * Boundary: a React hook with no rendering; the runtimes draw the views. Dates are written in the customer's digits.
 *           The web and native Scheduler both use it.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0192 (digits); STA-1371 (gap build, owner approval 2026-10-31).
 */
import {
  getLocalTimeZone,
  isSameDay,
  toCalendarDate,
  fromDate,
  type CalendarDate,
} from "@internationalized/date";
import { dateTimeFormatIn, type NumberingSystem } from "@stackra/i18n";
import { useState } from "react";

import type { SchedulerView } from "#contracts/enums/scheduler-view.enum";
import type { SchedulerContractProps } from "#contracts/types/scheduler-contract-props.type";
import type { SchedulerEvent } from "#contracts/types/scheduler-event.type";
import { SCHEDULER_KEYS } from "#core/constants/scheduler-keys.constant";
import { SCHEDULER_STEP } from "#core/constants/scheduler-step.constant";
import { schedulerDaysOf } from "#core/functions/scheduler-days-of.function";
import { useUiText } from "#react/hooks/use-ui-text";

/** The Scheduler's keys. */
const K = SCHEDULER_KEYS.ui.scheduler;

/** A day as a UTC instant, for Intl. */
const asUtc = (day: CalendarDate) => day.toDate("UTC");

/** The shared scheduler state. */
export function useSchedulerState(
  props: SchedulerContractProps,
  locale: string,
  numerals?: NumberingSystem,
): {
  readonly view: SchedulerView;
  readonly setView: (view: SchedulerView) => void;
  readonly date: CalendarDate;
  readonly setDate: (date: CalendarDate) => void;
  readonly move: (direction: -1 | 1) => void;
  readonly goToday: () => void;
  readonly days: readonly CalendarDate[];
  readonly timeZone: string;
  readonly now: Date;
  readonly today: CalendarDate;
  readonly startHour: number;
  readonly endHour: number;
  readonly heading: string;
  readonly isToday: (day: CalendarDate) => boolean;
  readonly weekdayOf: (day: CalendarDate) => string;
  readonly dayNumberOf: (day: CalendarDate) => string;
  readonly fullDateOf: (day: CalendarDate) => string;
  readonly hourLabelOf: (hour: number) => string;
  readonly timeOf: (event: SchedulerEvent) => string;
  readonly nameOf: (event: SchedulerEvent) => string;
  readonly slotNameOf: (day: CalendarDate, hour: number) => string;
  readonly startOf: (day: CalendarDate, hour?: number) => Date;
} {
  const t = useUiText();
  const timeZone = props.timeZone ?? getLocalTimeZone();
  // "Now" is read once, at mount: reading the clock on every render would make rendering impure.
  const [mountedAt] = useState(() => new Date());
  const now = props.now ?? mountedAt;
  const today = toCalendarDate(fromDate(now, timeZone));
  const [ownView, setOwnView] = useState<SchedulerView>(props.defaultView ?? "week");
  const [ownDate, setOwnDate] = useState<CalendarDate>(props.defaultDate ?? today);
  const view = props.view ?? ownView;
  const date = props.date ?? ownDate;
  const setView = (next: SchedulerView) => {
    setOwnView(next);
    props.onViewChange?.(next);
  };
  const setDate = (next: CalendarDate) => {
    setOwnDate(next);
    props.onDateChange?.(next);
  };
  const startHour = Math.min(23, Math.max(0, props.startHour ?? 0));
  const endHour = Math.min(24, Math.max(startHour + 1, props.endHour ?? 24));
  const utc = { timeZone: "UTC" } as const;
  const format = (options: Intl.DateTimeFormatOptions) =>
    dateTimeFormatIn(locale, options, numerals);
  const monthYear = format({ month: "long", year: "numeric", ...utc });
  const full = format({ dateStyle: "full", ...utc });
  const weekday = format({ weekday: "short", ...utc });
  const dayNumber = format({ day: "numeric", ...utc });
  const hour = format({ hour: "numeric", ...utc });
  const time = format({ timeStyle: "short", timeZone });
  const timeOf = (event: SchedulerEvent) =>
    event.isAllDay ? t(K.all_day) : `${time.format(event.start)} – ${time.format(event.end)}`;
  const startOf = (day: CalendarDate, at = 0) =>
    new Date(day.toDate(timeZone).getTime() + at * 3_600_000);
  return {
    view,
    setView,
    date,
    setDate,
    move: (direction) =>
      setDate(
        direction === 1 ? date.add(SCHEDULER_STEP[view]) : date.subtract(SCHEDULER_STEP[view]),
      ),
    goToday: () => setDate(today),
    days: schedulerDaysOf(view, date, locale),
    timeZone,
    now,
    today,
    startHour,
    endHour,
    heading: view === "day" ? full.format(asUtc(date)) : monthYear.format(asUtc(date)),
    isToday: (day) => isSameDay(day, today),
    weekdayOf: (day) => weekday.format(asUtc(day)),
    dayNumberOf: (day) => dayNumber.format(asUtc(day)),
    fullDateOf: (day) => full.format(asUtc(day)),
    hourLabelOf: (at) => hour.format(new Date(Date.UTC(2000, 0, 1, at))),
    timeOf,
    nameOf: (event) => t(K.event, { title: event.title, time: timeOf(event) }),
    slotNameOf: (day, at) =>
      t(K.slot, {
        day: full.format(asUtc(day)),
        time: hour.format(new Date(Date.UTC(2000, 0, 1, at))),
      }),
    startOf,
  };
}
