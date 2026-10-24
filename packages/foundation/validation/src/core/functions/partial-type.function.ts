/**
 * Stackra file contract:
 * Purpose: `PartialType(Base)`, which derives a shape whose data fields are those of another, each optional (a patch
 *          input).
 * Boundary: the derived class extends `Schema`, not `Base`: the base's methods and statics do not carry over. Each
 *           field is `?:`, so gen compiles it with `.exactOptional()`: absent is allowed, `undefined` is not (ADR 0294
 *           decision 26). The kind record keeps `{ base, partial: true }`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26; amendment item 13).
 */
import type { AnyClass } from "@stackra/container";

import { deriveShape } from "#core/functions/derive-shape.function";
import type { Fields } from "#core/types/fields.type";
import type { ShapeClass } from "#core/types/shape-class.type";

/**
 * A shape with every data field of `base`, each optional.
 *
 * @param base - the shape to derive from.
 * @example
 * export class UpdateProductInput extends PartialType(ProductDraft) {}
 */
export function PartialType<T extends object>(base: AnyClass<T>): ShapeClass<Partial<Fields<T>>> {
  return deriveShape(`PartialType(${base.name})`, { base, partial: true }) as unknown as ShapeClass<
    Partial<Fields<T>>
  >;
}
