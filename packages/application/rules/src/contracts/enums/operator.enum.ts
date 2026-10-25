/**
 * Stackra file contract:
 * Purpose: `Operator`, every test a condition leaf may apply to a fact, each with the shape of the value it takes
 *          (`operand`): none, one element, many elements, a range of two, a duration, or a circle.
 * Boundary: the engine's closed set. Which operators a field may use is its type's operator set (`FieldType`), so a
 *           consumer never picks operators; adding one is a change to this package, never to a consumer (ADR 0331
 *           decision 3). Codes are snake_case and are stored in saved rules, so a code never changes.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decisions 2, 3 and 11); ADR 0294 (decision 16: `Enum.of`); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/**
 * The operators.
 *
 * @example
 * Enum.meta(Operator, Operator.Between).operand; // "range"
 */
export const Operator = Enum.of({
  /** The fact equals the value. */
  Equals: ["equals", { operand: "one" }],
  /** The fact differs from the value. */
  NotEquals: ["not_equals", { operand: "one" }],
  /** The fact is one of the values. */
  OneOf: ["one_of", { operand: "many" }],
  /** The fact is none of the values. */
  NotOneOf: ["not_one_of", { operand: "many" }],
  /** The fact is below the value. */
  LessThan: ["less_than", { operand: "one" }],
  /** The fact is at or below the value. */
  AtMost: ["at_most", { operand: "one" }],
  /** The fact is above the value. */
  GreaterThan: ["greater_than", { operand: "one" }],
  /** The fact is at or above the value. */
  AtLeast: ["at_least", { operand: "one" }],
  /** The fact is within the two values, both included. */
  Between: ["between", { operand: "range" }],
  /** The text contains the value. */
  Contains: ["contains", { operand: "one" }],
  /** The text starts with the value. */
  StartsWith: ["starts_with", { operand: "one" }],
  /** The text ends with the value. */
  EndsWith: ["ends_with", { operand: "one" }],
  /** The instant is before the value. */
  Before: ["before", { operand: "one" }],
  /** The instant is after the value. */
  After: ["after", { operand: "one" }],
  /** The instant is at or after the current time minus the duration. */
  WithinLast: ["within_last", { operand: "duration" }],
  /** The instant is before the current time minus the duration. */
  NotWithinLast: ["not_within_last", { operand: "duration" }],
  /** The list holds the value. */
  Includes: ["includes", { operand: "one" }],
  /** The list holds at least one of the values. */
  IncludesAny: ["includes_any", { operand: "many" }],
  /** The list holds every one of the values. */
  IncludesAll: ["includes_all", { operand: "many" }],
  /** The list holds none of the values. */
  IncludesNone: ["includes_none", { operand: "many" }],
  /** The list is empty. */
  IsEmpty: ["is_empty", { operand: "none" }],
  /** The list holds at least one item. */
  IsNotEmpty: ["is_not_empty", { operand: "none" }],
  /** The point lies within the circle. */
  WithinRadius: ["within_radius", { operand: "circle" }],
  /** The point lies outside the circle. */
  OutsideRadius: ["outside_radius", { operand: "circle" }],
  /** The fact has a value. */
  IsSet: ["is_set", { operand: "none" }],
  /** The fact has no value; the one operator a missing fact matches. */
  IsNotSet: ["is_not_set", { operand: "none" }],
});

/** One of the codes above. */
export type Operator = Enum.Value<typeof Operator>;
