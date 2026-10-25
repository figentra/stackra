/**
 * Stackra file contract:
 * Purpose: `@ManyToOne(() => Target, options)`, the relation decorator of a field that points at one row: a `Ref<T>`
 *          to a model of the same module (a foreign key, indexed) or a `Link<T>` to a model of another module (an
 *          indexed `<name>_id` column, no foreign key).
 * Boundary: made with `createDecorator`, so it records the thunk and the options and installs no accessor. Typed
 *           against its field, so tsc refuses it on a field that is neither `Ref<T>` nor `Link<T>` of the target.
 *           Gen decides foreign key or link from module ownership and fails when the annotation disagrees. It may mark
 *           the model kinds only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 6, 11, 27 and 28); ADR 0231 (`fk_` names).
 */
import type { Ref } from "@mikro-orm/core";
import { createDecorator, DecoratorTarget } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import type { FieldDecorator } from "@stackra/validation";

import { MODEL_KINDS } from "#core/constants/model-kinds.constant";
import type { ManyToOneOptions } from "#core/types/many-to-one-options.type";
import type { RelationDefinition } from "#core/types/relation-definition.type";
import type { Link } from "#core/values/link.value";

/** The recording decorator. */
const MANY_TO_ONE = createDecorator<RelationDefinition>({
  kind: "many_to_one",
  target: DecoratorTarget.Field,
  kinds: MODEL_KINDS,
});

/**
 * Relates the field to one row of `target`.
 *
 * @param target - a thunk returning the target model (ADR 0294 R11).
 * @param options - the foreign key's delete rule.
 * @example
 * ```ts
 * @ManyToOne(() => Order, { onDelete: OnDelete.Cascade })
 * order!: Ref<Order>;
 *
 * @ManyToOne(() => Variant)
 * variant!: Link<Variant>;
 * ```
 */
export function ManyToOne<M extends object>(
  target: () => AnyClass<M>,
  options: ManyToOneOptions = {},
): FieldDecorator<Ref<M> | (M extends { id: string } ? Link<M> : never)> {
  return MANY_TO_ONE(Object.freeze({ target, ...options })) as unknown as FieldDecorator<
    Ref<M> | (M extends { id: string } ? Link<M> : never)
  >;
}

/** The relations recorded on each field of a class and its ancestors. */
ManyToOne.members = MANY_TO_ONE.members;
