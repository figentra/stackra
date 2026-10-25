/**
 * Stackra file contract:
 * Purpose: `refuseBelowFloors`, the write side of legal floors: a written path whose new value crosses its floor
 *          refuses the whole write.
 * Boundary: pure apart from the throw; only the written paths are checked. Internal: not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decision 6); config-model section 3 (a value below the floor is refused at save time).
 */
import type { SettingFloor, SettingValue } from "#contracts/index";
import { SettingBelowFloorError } from "#core/errors/setting-below-floor.error";
import { crossesFloor } from "#core/functions/crosses-floor.function";

/**
 * Refuses `values` when one crosses a floor of `floors`.
 *
 * @throws SettingBelowFloorError naming every crossing path with its law and market.
 * @example
 * refuseBelowFloors({ refundWindowDays: 7 }, floors);
 */
export function refuseBelowFloors(
  values: Readonly<Record<string, SettingValue>>,
  floors: readonly SettingFloor[],
): void {
  const crossed = floors.filter(
    (floor) => Object.hasOwn(values, floor.path) && crossesFloor(values[floor.path], floor),
  );
  if (crossed.length > 0)
    throw SettingBelowFloorError.create(
      { floors: crossed.map(({ path, law, market }) => ({ path, law, market })) },
      { fieldErrors: Object.fromEntries(crossed.map(({ path }) => [path, "setting_below_floor"])) },
    );
}
