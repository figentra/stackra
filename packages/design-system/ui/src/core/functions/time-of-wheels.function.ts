/**
 * Stackra file contract:
 * Purpose: `timeOfWheels(keys, cycle)`, the time of day a WheelTimePicker's hour, minute and period keys stand for.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0305 (rules 10 to 13).
 */
import type { HourCycle } from "#contracts/enums/hour-cycle.enum";
import type { TimeValue } from "#contracts/types/time-value.type";

/**
 * The time the wheels' keys stand for.
 * @param keys - the hour, minute and period keys
 * @param hourCycle - 12 or 24
 * @returns the time of day
 */
export function timeOfWheels(
  keys: Readonly<Record<string, string>>,
  hourCycle: HourCycle,
): TimeValue {
  const hour = Number(keys["hour"] ?? 0);
  const minute = Number(keys["minute"] ?? 0);
  if (hourCycle === 24) return { hour, minute };
  return { hour: (hour % 12) + (keys["period"] === "pm" ? 12 : 0), minute };
}
