/**
 * Stackra file contract:
 * Purpose: `@ManyToMany(() => Target, options)`, the relation decorator of a `Collection<T>` field joined through a
 *          pivot table that this side owns.
 * Boundary: made with `createDecorator`, so it records the thunk and the options and installs no accessor. Typed
 *           against its field, so tsc refuses it on a field that is not a `Collection` of the target. Same module
 *           only; the pivot table lives in the module's Postgres schema. It may mark the model kinds only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 6, 11 and 27); ADR 0231 (snake_case plural tables).
 */
import type { Collection } from "@mikro-orm/core";
import { createDecorator, DecoratorTarget } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import type { FieldDecorator } from "@stackra/validation";

import { MODEL_KINDS } from "#core/constants/model-kinds.constant";
import type { ManyToManyOptions } from "#core/types/many-to-many-options.type";
import type { RelationDefinition } from "#core/types/relation-definition.type";

/** A pivot table name: snake_case. */
const TABLE = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

/** The recording decorator. */
const MANY_TO_MANY = createDecorator<RelationDefinition>({
  kind: "many_to_many",
  target: DecoratorTarget.Field,
  kinds: MODEL_KINDS,
});

/**
 * Relates the field to many rows of `target` through a pivot table.
 *
 * @param target - a thunk returning the target model (ADR 0294 R11).
 * @param options - the pivot table's name.
 * @throws TypeError when `options.pivotTable` is not snake_case.
 * @example
 * ```ts
 * @ManyToMany(() => ProductCollection, { pivotTable: "product_collection_items" })
 * collections = new Collection<ProductCollection>(this);
 * ```
 */
export function ManyToMany<M extends object>(
  target: () => AnyClass<M>,
  options: ManyToManyOptions = {},
): FieldDecorator<Collection<M>> {
  if (options.pivotTable !== undefined && !TABLE.test(options.pivotTable))
    throw new TypeError(`"${options.pivotTable}" is not a snake_case pivot table name`);
  return MANY_TO_MANY(Object.freeze({ target, ...options })) as unknown as FieldDecorator<
    Collection<M>
  >;
}

/** The relations recorded on each field of a class and its ancestors. */
ManyToMany.members = MANY_TO_MANY.members;
