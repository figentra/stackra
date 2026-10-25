/**
 * Stackra file contract:
 * Purpose: `DecoratorDefinition`, what `createDecorator` takes: the decorator's own kind code, what it decorates (a
 *          class, a field or a method) and the kinds of class it may mark.
 * Boundary: a type only. A decorator outside its registered kinds or target is refused when it is applied.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 6: every decorator is made with `createDecorator` and registered with the
 *                     kinds it may target).
 */
import type { DecoratorTarget } from "#core/enums/decorator-target.enum";

/** The definition of one decorator. */
export interface DecoratorDefinition {
  /** The decorator's kind code, snake_case (`access_logged`, `lifetime`). */
  readonly kind: string;

  /** What it decorates. */
  readonly target: DecoratorTarget;

  /** The kind codes of the classes it may mark (`["action", "query", "service"]`). */
  readonly kinds: readonly string[];
}
