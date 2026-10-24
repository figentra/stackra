/**
 * Stackra file contract:
 * Purpose: `OmitType(Base, keys)`, which derives a shape from another without the named data fields (an update input
 *          without the server-set fields).
 * Boundary: the derived class extends `Schema`, not `Base`: the base's methods and statics do not carry over, and its
 *           type has the remaining data fields only. Gen compiles them with their rules (ADR 0294 amendment item 13).
 *           The kind record keeps `{ base, omit }`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26; amendment item 13).
 */
import type { AnyClass } from "@stackra/container";

import { deriveShape } from "#core/functions/derive-shape.function";
import type { Fields } from "#core/types/fields.type";
import type { ShapeClass } from "#core/types/shape-class.type";

/**
 * A shape with the data fields of `base` except `keys`.
 *
 * @param base - the shape to derive from.
 * @param keys - the data fields to leave out.
 * @example
 * export class ProductDraft extends OmitType(ProductView, ["id", "createdAt"]) {}
 */
export function OmitType<T extends object, const K extends keyof Fields<T>>(
  base: AnyClass<T>,
  keys: readonly K[],
): ShapeClass<Omit<Fields<T>, K>> {
  return deriveShape(`OmitType(${base.name})`, {
    base,
    omit: Object.freeze([...keys]),
  }) as unknown as ShapeClass<Omit<Fields<T>, K>>;
}
