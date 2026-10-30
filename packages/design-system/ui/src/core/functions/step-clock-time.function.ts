/**
 * Stackra file contract:
 * Purpose: `stepClockTime(value, view, steps, minuteStep)`, a TimeClock's time moved by whole steps on its face: an
 *          hour per step on the hours face (wrapping through the day), `minuteStep` minutes per step on the minutes
 *          face (wrapping within the hour, from the step below a time between two steps).
 * Boundary: pure; a negative `steps` goes back.
 * Runtime: isomorphic
 * Governing contract: STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ClockView } from "#contracts/types/clock-view.type";
import type { TimeValue } from "#contracts/types/time-value.type";

/**
 * The time `steps` steps away.
 * @example stepClockTime({ hour: 9, minute: 55 }, "minutes", 1, 5); // 9:00
 */
export function stepClockTime(
  value: TimeValue,
  view: ClockView,
  steps: number,
  minuteStep = 1,
): TimeValue {
  if (view === "hours") {
    return { hour: (((value.hour + steps) % 24) + 24) % 24, minute: value.minute };
  }
  const step = Math.max(1, Math.floor(minuteStep));
  const from = Math.floor(value.minute / step) * step;
  return { hour: value.hour, minute: (((from + steps * step) % 60) + 60) % 60 };
}
