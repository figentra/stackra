/**
 * Stackra file contract:
 * Purpose: `DecoratorTarget`, the three things a decorator may decorate (ADR 0294 R6): a class (a facet), a field
 *          (a constraint, transform, serializer, relation or source) and a method (`@Step`, `@Transition`).
 * Boundary: an enum and its same-named type; parameter decorators are banned, so there is no fourth target.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 6 and 16 Enum row); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** What a decorator decorates. */
export const DecoratorTarget = Enum.of({
  /** A class decorator. */
  Class: "class",
  /** A field decorator. */
  Field: "field",
  /** A method decorator. */
  Method: "method",
});

/** One of the decorator targets. */
export type DecoratorTarget = Enum.Value<typeof DecoratorTarget>;
