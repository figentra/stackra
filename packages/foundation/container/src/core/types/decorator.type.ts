/**
 * Stackra file contract:
 * Purpose: `Decorator<V>`, what `createDecorator` returns: called with a value it gives the legacy decorator, and it
 *          is its own metadata key, so the Explorer that acts on it and gen look up the same thing.
 * Boundary: a type only. The decorator records the value and nothing else: it installs no accessor and wraps no
 *           method, because a class field defined on the instance hides a prototype accessor.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 6); ADR 0144 (Explorers) as amended by 0263.
 */
import type { DecoratorTarget } from "#core/enums/decorator-target.enum";
import type { AnyClass } from "#core/types/any-class.type";
import type { DecoratorFunction } from "#core/types/decorator-function.type";

/** A decorator taking a value of type `V`, and the reader of what it recorded. */
export interface Decorator<V> {
  /** Gives the decorator its value: `@AccessLogged({ classification })`. */
  (value: V): DecoratorFunction;

  /** The decorator's kind code. */
  readonly kind: string;

  /** What it decorates. */
  readonly target: DecoratorTarget;

  /** The kind codes of the classes it may mark. */
  readonly kinds: readonly string[];

  /**
   * The value recorded on `type` by a class decorator, or on its nearest decorated ancestor.
   * @returns undefined when neither the class nor an ancestor carries it.
   */
  on: (type: AnyClass) => V | undefined;

  /**
   * The values recorded on the fields or methods of `type` and its ancestors, by member name; a subclass's value
   * wins over its ancestor's.
   * @returns an empty map for a class decorator or an undecorated class.
   */
  members: (type: AnyClass) => ReadonlyMap<string | symbol, V>;
}
