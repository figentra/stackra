/**
 * Stackra file contract:
 * Purpose: `@Index(properties, options)`, the class facet that declares one index of a model's table; a model carries
 *          one `@Index` per index, so `stackra db diff` never proposes dropping one it did not declare.
 * Boundary: made with `createDecorator`, so it records metadata only. A model may carry several, so each application
 *           adds its definition to the ones recorded before; `Index.on(Model)` lists them in source order. Paths are
 *           checked by gen, which also names the index (`idx_<table>_<columns>`). It may mark the model kinds only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 6 and 27); ADR 0231 (`idx_` names); ADR 0159 (migrations).
 */
import { createDecorator, DecoratorTarget } from "@stackra/container";
import type { AnyClass, DecoratorFunction } from "@stackra/container";

import { MODEL_KINDS } from "#core/constants/model-kinds.constant";
import type { IndexDefinition } from "#core/types/index-definition.type";
import type { IndexOptions } from "#core/types/index-options.type";

/** The recording decorator: the full list of a class's indexes. */
const INDEX = createDecorator<readonly IndexDefinition[]>({
  kind: "index",
  target: DecoratorTarget.Class,
  kinds: MODEL_KINDS,
});

/**
 * Declares an index over `properties`, in column order.
 *
 * @param properties - model keys or embedded paths (`total.minor`), at least one.
 * @param options - a unique index, a partial index's predicate.
 * @throws TypeError when `properties` is empty; at class definition, when applied to anything but a model class.
 * @example
 * ```ts
 * @Index(["slug"], { unique: true })
 * @Index(["status", "createdAt"])
 * export class Product extends Model.with(HasPublicId("prd"), Timestamps) {}
 * ```
 */
export function Index(
  properties: readonly string[],
  options: IndexOptions = {},
): DecoratorFunction {
  if (properties.length === 0) throw new TypeError("@Index needs at least one property");
  const definition: IndexDefinition = Object.freeze({
    properties: Object.freeze([...properties]),
    unique: options.unique ?? false,
    ...(options.where === undefined ? {} : { where: options.where }),
  });
  return ((target: object, property?: string | symbol, descriptor?: PropertyDescriptor): void => {
    // Decorators apply bottom-up, so prepending keeps the definitions in source order.
    const before = property === undefined ? (INDEX.on(target as AnyClass) ?? []) : [];
    const apply = INDEX(Object.freeze([definition, ...before])) as (
      target: object,
      property?: string | symbol,
      descriptor?: PropertyDescriptor,
    ) => void;
    apply(target, property, descriptor);
  }) as DecoratorFunction;
}

/**
 * The indexes declared on `type` (or inherited from its nearest decorated ancestor), in source order.
 *
 * @returns an empty array for a model without `@Index`.
 */
Index.on = (type: AnyClass): readonly IndexDefinition[] => INDEX.on(type) ?? [];
