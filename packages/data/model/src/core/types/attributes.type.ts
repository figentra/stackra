/**
 * Stackra file contract:
 * Purpose: `Attributes<M>`, the values a factory's `definition` and a seeder give for a model `M`: any subset of its
 *          data fields, where a relation also takes what builds or names its target (a factory, a public id) and a
 *          `Translated` field also takes its plain locale map.
 * Boundary: a type only. Methods and the protected `~kind` brand drop out; every field is optional, because traits and
 *           defaults fill the rest. A `Ref<T>` takes the target, a `RelationSource<T>`; a `Link<T>` takes the target's
 *           public id, a `Link`, a `RelationSource<T>`; a `Collection<T>` takes an array of targets or sources.
 * Runtime: isomorphic
 * Governing contract: ADR 0190 (factories with states); ADR 0294 (decisions 11, 16, 27 and 28); ADR 0162 (per-locale
 *                     fields).
 */
import type { Collection, Reference } from "@mikro-orm/core";

import type { RelationSource } from "#core/types/relation-source.type";
import type { Link } from "#core/values/link.value";
import type { Translated } from "#core/values/translated.value";

/** The value a factory may give for a field of type `V`. */
type AttributeValue<V> =
  V extends Collection<infer T extends object, object>
    ? readonly (T | RelationSource<T>)[]
    : V extends Link<infer T extends { id: string }>
      ? Link<T> | T["id"] | RelationSource<T>
      : V extends Reference<infer T extends object>
        ? V | T | RelationSource<T>
        : V extends Translated
          ? Translated | Readonly<Record<string, string>>
          : V;

/**
 * The attributes of a model `M`.
 *
 * @example
 * definition(faker: Faker): Attributes<OrderLine> {
 *   return { order: OrderFactory.new(), variant: faker.publicId("var"), quantity: 1 };
 * }
 */
export type Attributes<M> = {
  [K in keyof M as M[K] extends (...args: never[]) => unknown ? never : K]?: AttributeValue<M[K]>;
};
