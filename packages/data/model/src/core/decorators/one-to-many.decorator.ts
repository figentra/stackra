/**
 * Stackra file contract:
 * Purpose: `@OneToMany(() => Target, inverse, options)`, the relation decorator of a `Collection<T>` field whose rows
 *          point back at this one through their `@ManyToOne` (`(line) => line.order`).
 * Boundary: made with `createDecorator`, so it records the thunks and the options and installs no accessor. Typed
 *           against its field, so tsc refuses it on a field that is not a `Collection` of the target. Same module
 *           only: across modules a relation is a `Link<T>` and has no inverse. It may mark the model kinds only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 6, 11, 27 and 28).
 */
import type { Collection } from "@mikro-orm/core";
import { createDecorator, DecoratorTarget } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import type { FieldDecorator } from "@stackra/validation";

import { MODEL_KINDS } from "#core/constants/model-kinds.constant";
import type { OneToManyOptions } from "#core/types/one-to-many-options.type";
import type { RelationDefinition } from "#core/types/relation-definition.type";

/** The recording decorator. */
const ONE_TO_MANY = createDecorator<RelationDefinition>({
  kind: "one_to_many",
  target: DecoratorTarget.Field,
  kinds: MODEL_KINDS,
});

/**
 * Relates the field to the rows of `target` that point back at this one.
 *
 * @param target - a thunk returning the target model (ADR 0294 R11).
 * @param inverse - the target's many-to-one property back to this model.
 * @param options - whether a removed child is deleted.
 * @example
 * ```ts
 * @OneToMany(() => OrderLine, (line) => line.order, { orphanRemoval: true })
 * lines = new Collection<OrderLine>(this);
 * ```
 */
export function OneToMany<M extends object>(
  target: () => AnyClass<M>,
  inverse: (item: M) => unknown,
  options: OneToManyOptions = {},
): FieldDecorator<Collection<M>> {
  return ONE_TO_MANY(
    Object.freeze({ target, inverse: inverse as (item: never) => unknown, ...options }),
  ) as unknown as FieldDecorator<Collection<M>>;
}

/** The relations recorded on each field of a class and its ancestors. */
OneToMany.members = ONE_TO_MANY.members;
