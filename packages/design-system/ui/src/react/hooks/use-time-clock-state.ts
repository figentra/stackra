/**
 * Stackra file contract:
 * Purpose: `useTimeClockState(props, locale, format)`, the state every runtime's TimeClock shares: the hour cycle, the
 *          face shown (hours or minutes), the time (controlled or its own, 12:00 by default), the header's hour and
 *          minute text, AM or PM, and the changes the face makes: a point on it, a step by the keys or the screen
 *          reader, and a press on AM or PM. A change to the same time is not reported.
 * Boundary: a React hook with no rendering; the runtimes draw the face, read the pointer or the touch, and turn it into
 *           a point from the face's centre in drawing units. The web and native TimeClock both use it.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave D, owner approval 2026-10-30).
 */
import { useState } from "react";

import type { ClockView } from "#contracts/types/clock-view.type";
import type { HourCycle } from "#contracts/enums/hour-cycle.enum";
import type { TimeClockContractProps } from "#contracts/types/time-clock-contract-props.type";
import type { TimeValue } from "#contracts/types/time-value.type";
import { angleOfPoint } from "#core/functions/angle-of-point.function";
import { hourCycleOf } from "#core/functions/hour-cycle-of.function";
import { stepClockTime } from "#core/functions/step-clock-time.function";
import { timeOfClockAngle } from "#core/functions/time-of-clock-angle.function";

/** Two digits, no grouping: the header's minutes and a 24-hour clock's hours. */
const TWO_DIGITS = { minimumIntegerDigits: 2, useGrouping: false } as const;

/**
 * The shared TimeClock state.
 * @param props - the clock's value, default, change handler, minute step and hour cycle
 * @param locale - the locale whose hour cycle applies when the props give none
 * @param format - the runtime's number writer, for the customer's digits
 * @returns the time, the face shown and the changes the face makes
 */
export function useTimeClockState(
  {
    value,
    defaultValue,
    onChange,
    minuteStep = 1,
    hourCycle,
  }: Pick<
    TimeClockContractProps,
    "value" | "defaultValue" | "onChange" | "minuteStep" | "hourCycle"
  >,
  locale: string,
  format: (value: number, options?: Intl.NumberFormatOptions) => string,
): {
  readonly cycle: HourCycle;
  readonly view: ClockView;
  readonly setView: (view: ClockView) => void;
  readonly time: TimeValue;
  readonly hourText: string;
  readonly minuteText: string;
  readonly isPm: boolean;
  readonly change: (next: TimeValue) => void;
  readonly pointTo: (dx: number, dy: number, isNearCentre: boolean) => void;
  readonly step: (by: number) => void;
  readonly setPeriod: (isPm: boolean) => void;
} {
  const cycle = hourCycle ?? hourCycleOf(locale);
  const [view, setView] = useState<ClockView>("hours");
  const [own, setOwn] = useState<TimeValue>(() => defaultValue ?? { hour: 12, minute: 0 });
  const time = value ?? own;
  const change = (next: TimeValue) => {
    if (next.hour === time.hour && next.minute === time.minute) return;
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };
  return {
    cycle,
    view,
    setView,
    time,
    hourText:
      cycle === 12
        ? format(time.hour % 12 === 0 ? 12 : time.hour % 12)
        : format(time.hour, TWO_DIGITS),
    minuteText: format(time.minute, TWO_DIGITS),
    isPm: time.hour >= 12,
    change,
    // Only a 24-hour face has an inner ring (00 and 13 to 23).
    pointTo: (dx, dy, isNearCentre) =>
      change(
        timeOfClockAngle(angleOfPoint(dx, dy), {
          view,
          value: time,
          hourCycle: cycle,
          isInner: cycle === 24 && isNearCentre,
          minuteStep,
        }),
      ),
    step: (by) => change(stepClockTime(time, view, by, minuteStep)),
    setPeriod: (isPm) => change({ hour: (time.hour % 12) + (isPm ? 12 : 0), minute: time.minute }),
  };
}
