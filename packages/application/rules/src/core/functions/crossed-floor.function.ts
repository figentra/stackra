/**
 * Stackra file contract:
 * Purpose: `crossedFloor`, the one comparison of an outcome parameter with its legal floor: a number below a `min` or
 *          above a `max`, or a money amount that does so in the floor's currency or is in another currency.
 * Boundary: pure; internal to the package. `guardFloors` lifts what it reports at decision time and `Rules`'
 *           `floorProblems` refuses it at save time, so the two never disagree. A money amount in another currency
 *           counts as crossed: the engine never converts, and the floor's own amount is the only value known to be
 *           lawful. A floor whose pack value does not fit the parameter's type is a pack bug and throws.
 * Runtime: isomorphic
 * Governing contract: config-model sections 3 and 4 (a rule outcome never crosses a floor); ADR 0370 (decision 6);
 *                     ADR 0220 (an amount in another currency never matches).
 */
import type { Json } from "@stackra/contracts";
import { FloorBound } from "@stackra/market-packs";
import type { ResolvedValue } from "@stackra/market-packs";

import { FieldType } from "#contracts/index";
import { moneyOf } from "#core/functions/money-of.function";
import type { FloorCrossing } from "#core/types/floor-crossing.type";

/**
 * Whether `value` of a `type` parameter crosses `floor`, and the floor value it must take when it does.
 *
 * @throws TypeError when the floor's pack value is not a number (number parameter) or a money amount (money parameter).
 * @example
 * crossedFloor(FieldType.Number, 7, withdrawalDays); // { to: 14, reason: "past_floor" }
 */
export function crossedFloor(
  type: FieldType,
  value: Json | undefined,
  floor: ResolvedValue,
): FloorCrossing | undefined {
  const bound = floor.floor?.bound;
  if (bound === undefined) return undefined;
  const crosses = (amount: number, limit: number): boolean =>
    bound === FloorBound.Min ? amount < limit : amount > limit;
  if (type === FieldType.Money) {
    const limit = moneyOf(floor.value);
    if (limit === undefined)
      throw new TypeError(`crossedFloor: the floor ${floor.key} of ${floor.market} is not money`);
    const to = { minor: limit.minor, currency: limit.currency };
    const amount = moneyOf(value);
    if (amount === undefined) return undefined;
    if (amount.currency !== limit.currency) return { to, reason: "currency_mismatch" };
    return crosses(amount.minor, limit.minor) ? { to, reason: "past_floor" } : undefined;
  }
  if (typeof floor.value !== "number")
    throw new TypeError(`crossedFloor: the floor ${floor.key} of ${floor.market} is not a number`);
  if (typeof value !== "number") return undefined;
  return crosses(value, floor.value) ? { to: floor.value, reason: "past_floor" } : undefined;
}
