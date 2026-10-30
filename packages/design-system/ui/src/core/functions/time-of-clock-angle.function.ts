/**
 * Stackra file contract:
 * Purpose: `timeOfClockAngle(angle, input)`, the time a press or drag at `angle` on a TimeClock's face picks: on the
 *          hours face the nearest hour (12-hour: keeping the morning or afternoon of `value`; 24-hour: 1 to 12 on the
 *          outer ring, 13 to 23 and 00 on the inner one), on the minutes face the nearest `minuteStep`.
 * Boundary: pure; `angle` is clockwise from the top (see `angleOfPoint`).
 * Runtime: isomorphic
 * Governing contract: STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ClockView } from "#contracts/types/clock-view.type";
import type { HourCycle } from "#contracts/enums/hour-cycle.enum";
import type { TimeValue } from "#contracts/types/time-value.type";
import { snapAngle } from "#core/functions/snap-angle.function";

/**
 * The time `angle` picks.
 * @example timeOfClockAngle(90, { view: "hours", value: { hour: 14, minute: 0 }, hourCycle: 12 }); // 15:00
 */
export function timeOfClockAngle(
  angle: number,
  input: {
    readonly view: ClockView;
    readonly value: TimeValue;
    readonly hourCycle: HourCycle;
    readonly isInner?: boolean | undefined;
    readonly minuteStep?: number | undefined;
  },
): TimeValue {
  const { view, value, hourCycle } = input;
  if (view === "minutes") {
    const step = Math.max(1, Math.floor(input.minuteStep ?? 1));
    return { hour: value.hour, minute: snapAngle(angle, step * 6) / 6 };
  }
  const slot = snapAngle(angle, 30) / 30;
  if (hourCycle === 24) {
    const outer = slot === 0 ? 12 : slot;
    const inner = slot === 0 ? 0 : slot + 12;
    return { hour: input.isInner ? inner : outer, minute: value.minute };
  }
  return { hour: slot + (value.hour >= 12 ? 12 : 0), minute: value.minute };
}
