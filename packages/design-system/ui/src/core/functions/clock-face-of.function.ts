/**
 * Stackra file contract:
 * Purpose: `clockFaceOf(value, view, hourCycle, format)`, the numerals and hand of a TimeClock's face: on the hours
 *          face 12 and 1 to 11 (plus 00 and 13 to 23 on an inner ring in a 24-hour cycle), on the minutes face 00 to
 *          55 by fives; the hand points at the chosen hour or minute.
 * Boundary: pure over the number writer it is given, so the numerals take the customer's digits. Angles are clockwise
 *           from the top and never mirrored.
 * Runtime: isomorphic
 * Governing contract: STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ClockView } from "#contracts/types/clock-view.type";
import type { HourCycle } from "#contracts/enums/hour-cycle.enum";
import type { TimeValue } from "#contracts/types/time-value.type";
import type { ClockFace } from "#core/types/clock-face.type";

/** The twelve positions of a face. */
const SLOTS = Array.from({ length: 12 }, (_, slot) => slot);

/**
 * The face of `value` on `view`.
 * @example clockFaceOf({ hour: 15, minute: 0 }, "hours", 12, String).hand; // { angle: 90, isInner: false }
 */
export function clockFaceOf(
  value: TimeValue,
  view: ClockView,
  hourCycle: HourCycle,
  format: (value: number, options?: Intl.NumberFormatOptions) => string,
): ClockFace {
  const two = { minimumIntegerDigits: 2, useGrouping: false } as const;
  if (view === "minutes") {
    return {
      numerals: SLOTS.map((slot) => ({
        text: format(slot * 5, two),
        angle: slot * 30,
        isInner: false,
        isSelected: value.minute === slot * 5,
      })),
      hand: { angle: value.minute * 6, isInner: false },
    };
  }
  const outer = SLOTS.map((slot) => {
    const shown = slot === 0 ? 12 : slot;
    const isSelected = hourCycle === 12 ? value.hour % 12 === slot : value.hour === shown;
    return { text: format(shown), angle: slot * 30, isInner: false, isSelected };
  });
  const isInnerHour = hourCycle === 24 && (value.hour === 0 || value.hour > 12);
  const inner =
    hourCycle === 24
      ? SLOTS.map((slot) => {
          const hour = slot === 0 ? 0 : slot + 12;
          return {
            text: format(hour, two),
            angle: slot * 30,
            isInner: true,
            isSelected: value.hour === hour,
          };
        })
      : [];
  return {
    numerals: [...outer, ...inner],
    hand: { angle: (value.hour % 12) * 30, isInner: isInnerHour },
  };
}
