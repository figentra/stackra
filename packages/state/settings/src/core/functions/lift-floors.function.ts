/**
 * Stackra file contract:
 * Purpose: `liftFloors`, the read-time half of the legal floors: each field of a resolved settings group that crosses
 *          its market floor (a default included) is moved to the floor, in place. Both readers call it, so every read
 *          path honours floors.
 * Boundary: internal; mutates the parsed group it is given and returns it. A floor whose path names a section field
 *          (`section.field`) lifts the field inside the section. Floors are pack data; no number here.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decision 6); ADR 0395 (decision 4: one reader path honours floors); config-model
 *                     section 3.
 */
import type { SettingFloor, SettingValue } from "#contracts/index";
import { crossesFloor } from "#core/functions/crosses-floor.function";

/**
 * Lifts the fields of `data` that cross `floors`.
 *
 * @example
 * liftFloors(returns, [{ path: "windowDays", value: 14, bound: "min", ... }]); // returns.windowDays is at least 14
 */
export function liftFloors<T extends object>(data: T, floors: readonly SettingFloor[]): T {
  for (const floor of floors) {
    const dot = floor.path.indexOf(".");
    const holder = (
      dot === -1 ? data : (data as Record<string, unknown>)[floor.path.slice(0, dot)]
    ) as Record<string, unknown> | undefined;
    if (holder === undefined || holder === null) continue;
    const name = dot === -1 ? floor.path : floor.path.slice(dot + 1);
    if (crossesFloor(holder[name] as SettingValue | undefined, floor)) holder[name] = floor.value;
  }
  return data;
}
