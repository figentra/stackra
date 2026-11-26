/**
 * Stackra file contract:
 * Purpose: `@Deprecated({ since, sunset, replacement })`, the deprecation marker: on a class (an action, a query, an
 *          event, a settings group, a service or another kind whose identity the manifest locks) or a field of a shape
 *          kind (a schema field, an event field, a setting), it records since when, until when and what replaces it.
 *          Gen records it in `stackra.manifest.json` and warns where a member uses it.
 * Boundary: two recording decorators made with `createDecorator`, one per target, behind one function that picks by
 *           how it is applied. It checks its options with `deprecationProblem` when called, so a malformed deprecation
 *           or a sunset inside the window throws a TypeError on import. It records only and fits a field of any type;
 *           it never changes behaviour.
 * Runtime: isomorphic
 * Governing contract: ADR 0131 (decision 4); ADR 0136 (decision 4: at least 6 months for a public API); ADR 0177
 *                     (decision 6: one minor before 1.0, one major after); ADR 0294 (decision 6); STA-2836.
 */
import { createDecorator, DecoratorTarget } from "@stackra/container";
import type { AnyClass, DecoratorFunction } from "@stackra/container";
import { deprecationProblem } from "@stackra/contracts";
import type { Deprecation } from "@stackra/contracts";

import { DEPRECATABLE_KINDS } from "#core/constants/deprecatable-kinds.constant";
import { SHAPE_KINDS } from "#core/constants/shape-kinds.constant";

/** The class form. */
const ON_CLASS = createDecorator<Deprecation>({
  kind: "deprecated",
  target: DecoratorTarget.Class,
  kinds: DEPRECATABLE_KINDS,
});

/** The field form. */
const ON_FIELD = createDecorator<Deprecation>({
  kind: "deprecated",
  target: DecoratorTarget.Field,
  kinds: SHAPE_KINDS,
});

/**
 * Marks a class or a field as deprecated.
 *
 * @param options - `since`, the release (or date version) that deprecates it; `sunset`, the release (or date) that
 *   removes it, at least one minor later before 1.0, one major after, or six months for a date; `replacement`, what to
 *   use instead.
 * @throws TypeError when the options are malformed or the sunset is inside the window (`deprecationProblem`).
 * @example
 * ```ts
 * @Deprecated({ since: "0.34.0", sunset: "0.35.0", replacement: "orders.order.cancel@2" })
 * export class CancelOrderAction extends Action({ key: "orders.order.cancel" }) { ... }
 *
 * @Deprecated({ since: "0.34.0", sunset: "0.35.0", replacement: "total" })
 * amount = 0;
 * ```
 */
export function Deprecated(options: Deprecation): DecoratorFunction {
  const problem = deprecationProblem(options);
  if (problem !== undefined)
    throw new TypeError(`@Deprecated: ${problem.message} (${problem.code})`);
  const recorded: Deprecation = Object.freeze({ ...options });
  return ((target: object, property?: string | symbol, descriptor?: PropertyDescriptor): void => {
    if (property === undefined) ON_CLASS(recorded)(target as AnyClass);
    // With a descriptor (a method) the field form throws: a method is neither form.
    else ON_FIELD(recorded)(target, property, descriptor as PropertyDescriptor);
  }) as DecoratorFunction;
}

/** The deprecation recorded on a class or its nearest deprecated ancestor. */
Deprecated.on = ON_CLASS.on;

/** The deprecations recorded on each field of a class and its ancestors. */
Deprecated.members = ON_FIELD.members;
