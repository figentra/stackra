/**
 * Stackra file contract:
 * Purpose: `@OneToOne(() => Target, options)`, the relation decorator of a field that points at exactly one row which
 *          points at no other: the owning side holds the foreign key (unique, indexed); the inverse side is written
 *          `@OneToOne(() => Target, (row) => row.back)` and holds no column.
 * Boundary: made with `createDecorator`, so it records the thunk, the inverse and the options and installs no
 *           accessor. Typed against its field, so tsc refuses it on a field that is not `Ref<T>` of the target. Gen
 *           writes the owner or `mappedBy` side from the inverse (`emit-entities`). It may mark the model kinds only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 6, 11 and 27; R6 names `@OneToOne`); ADR 0231 (`fk_` names).
 */
import type { Ref } from "@mikro-orm/core";
import { createDecorator, DecoratorTarget } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import type { FieldDecorator } from "@stackra/validation";

import { MODEL_KINDS } from "#core/constants/model-kinds.constant";
import type { ManyToOneOptions } from "#core/types/many-to-one-options.type";
import type { RelationDefinition } from "#core/types/relation-definition.type";

/** The recording decorator. */
const ONE_TO_ONE = createDecorator<RelationDefinition>({
  kind: "one_to_one",
  target: DecoratorTarget.Field,
  kinds: MODEL_KINDS,
});

/**
 * Relates the field to one row of `target`, one to one.
 *
 * @param target - a thunk returning the target model (ADR 0294 R11).
 * @param inverseOrOptions - on the inverse side, the target's owning property (`(profile) => profile.user`); on the
 *                           owning side, the foreign key's delete rule (the same options as `@ManyToOne`).
 * @example
 * ```ts
 * @OneToOne(() => User, { onDelete: OnDelete.Cascade })
 * user!: Ref<User>;
 *
 * @OneToOne(() => Profile, (profile) => profile.user)
 * profile!: Ref<Profile> | null;
 * ```
 */
export function OneToOne<M extends object>(
  target: () => AnyClass<M>,
  inverseOrOptions: ((item: M) => unknown) | ManyToOneOptions = {},
): FieldDecorator<Ref<M>> {
  const definition =
    typeof inverseOrOptions === "function"
      ? { target, inverse: inverseOrOptions as (item: never) => unknown }
      : { target, ...inverseOrOptions };
  return ONE_TO_ONE(Object.freeze(definition)) as unknown as FieldDecorator<Ref<M>>;
}

/** The relations recorded on each field of a class and its ancestors. */
OneToOne.members = ONE_TO_ONE.members;
