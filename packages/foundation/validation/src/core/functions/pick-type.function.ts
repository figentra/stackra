/**
 * Stackra file contract:
 * Purpose: `PickType(Base, keys)`, which derives a shape from the named data fields of another, so a form or a view
 *          keeps the producer's rules instead of re-declaring them.
 * Boundary: the derived class extends `Schema`, not `Base`: the base's methods and statics do not carry over, and its
 *           type has the picked data fields only. Gen compiles the picked fields with their rules (ADR 0294 amendment
 *           item 13). The kind record keeps `{ base, pick }`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26; amendment item 13); ADR 0055 (decision 1: same schemas as the API).
 */
import type { AnyClass } from "@stackra/container";

import { deriveShape } from "#core/functions/derive-shape.function";
import type { Fields } from "#core/types/fields.type";
import type { ShapeClass } from "#core/types/shape-class.type";

/**
 * A shape with only the `keys` data fields of `base`.
 *
 * @param base - the shape to pick from.
 * @param keys - the data fields to keep.
 * @example
 * export class QuickOrderForm extends PickType(CreateOrderInput, ["lines"]) {
 *   redeemPoints = 0;
 * }
 */
export function PickType<T extends object, const K extends keyof Fields<T>>(
  base: AnyClass<T>,
  keys: readonly K[],
): ShapeClass<Pick<Fields<T>, K>> {
  return deriveShape(`PickType(${base.name})`, {
    base,
    pick: Object.freeze([...keys]),
  }) as unknown as ShapeClass<Pick<Fields<T>, K>>;
}
