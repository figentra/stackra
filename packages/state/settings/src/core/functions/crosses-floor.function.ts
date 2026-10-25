/**
 * Stackra file contract:
 * Purpose: `crossesFloor`, whether one setting value is on the wrong side of a legal floor: below a minimum, above a
 *          maximum, or not of the floor's type at all (`null` included, so "no limit" never slips under a floor).
 * Boundary: pure. Booleans order `false` below `true`. Internal: not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decision 6); config-model section 3.
 */
import { FloorBound } from "@stackra/market-packs";

import type { SettingFloor, SettingValue } from "#contracts/index";

/**
 * Whether `value` crosses `floor`.
 *
 * @example
 * crossesFloor(7, { bound: "min", value: 14, ... }); // true
 */
export function crossesFloor(value: SettingValue | undefined, floor: SettingFloor): boolean {
  if (typeof value !== typeof floor.value) return true;
  const [held, limit] = [Number(value), Number(floor.value)];
  return floor.bound === FloorBound.Min ? held < limit : held > limit;
}
