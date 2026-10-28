/**
 * Stackra file contract:
 * Purpose: `DecoratorFunction`, the legacy decorator a decorator made by `createDecorator` returns once it is given
 *          its value: one call shape for a class, a field and a method, so `@X(value)` type-checks on each and the
 *          runtime refuses the targets the definition does not allow.
 * Boundary: a type only; legacy decorators (ADR 0005), no metadata emission.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 6); ADR 0005 (legacy decorators).
 */
import type { AnyClass } from "#core/types/any-class.type";

/** A legacy class, field or method decorator. */
export interface DecoratorFunction {
  /** On a class: receives the class. */
  (target: AnyClass): void;

  /** On a field: receives the prototype and the field name. */
  (target: object, property: string | symbol): void;

  /** On a method: receives the prototype, the method name and its descriptor. */
  // oxlint-disable-next-line typescript/unified-signatures -- reason: one call signature per decorator target, each with its own doc
  (target: object, property: string | symbol, descriptor: PropertyDescriptor): void;
}
