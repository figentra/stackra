/**
 * Stackra file contract:
 * Purpose: `FieldType`, the type of a field a fact source registers, each with its fixed operator set: string, number,
 *          money, date, enum, list and geo.
 * Boundary: the operator sets are the engine's (ADR 0331 decision 3): a consumer chooses a field's type and gets its
 *           operators, never a subset of its own. IAM conditions may read the same sets (decision 11). The fact value
 *           of each type is a `string`, a finite `number`, a `Money`, a `Date`, an enum code, a `string[]` and a
 *           `GeoPoint`; a missing fact is `null` or `undefined`.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decisions 3, 4 and 11); ADR 0220 (money); ADR 0294 (decision 16: `Enum.of`).
 */
import { Enum } from "@stackra/contracts";

import { Operator } from "#contracts/enums/operator.enum";

/** A frozen operator set, typed wide so `operators.includes(operator)` takes any operator. */
const set = (...operators: readonly Operator[]): readonly Operator[] => Object.freeze(operators);

/** The operators of an ordered amount: a number or a money amount. */
const ORDERED = set(
  Operator.Equals,
  Operator.NotEquals,
  Operator.LessThan,
  Operator.AtMost,
  Operator.GreaterThan,
  Operator.AtLeast,
  Operator.Between,
  Operator.IsSet,
  Operator.IsNotSet,
);

/**
 * The field types, each with its operator set in the order a builder offers them.
 *
 * @example
 * Enum.meta(FieldType, FieldType.Money).operators.includes(Operator.AtLeast); // true
 */
export const FieldType = Enum.of({
  /** Text, compared exactly (case-sensitive). */
  String: [
    "string",
    {
      operators: set(
        Operator.Equals,
        Operator.NotEquals,
        Operator.OneOf,
        Operator.NotOneOf,
        Operator.Contains,
        Operator.StartsWith,
        Operator.EndsWith,
        Operator.IsSet,
        Operator.IsNotSet,
      ),
    },
  ],
  /** A finite number. */
  Number: ["number", { operators: ORDERED }],
  /** A `Money` amount; an amount in another currency never matches (ADR 0220). */
  Money: ["money", { operators: ORDERED }],
  /** An instant; relative tests read the current time the caller supplies. */
  Date: [
    "date",
    {
      operators: set(
        Operator.Before,
        Operator.After,
        Operator.Between,
        Operator.WithinLast,
        Operator.NotWithinLast,
        Operator.IsSet,
        Operator.IsNotSet,
      ),
    },
  ],
  /** One code of the values the field registers. */
  Enum: [
    "enum",
    {
      operators: set(
        Operator.Equals,
        Operator.NotEquals,
        Operator.OneOf,
        Operator.NotOneOf,
        Operator.IsSet,
        Operator.IsNotSet,
      ),
    },
  ],
  /** A list of strings (tags, product ids). */
  List: [
    "list",
    {
      operators: set(
        Operator.Includes,
        Operator.IncludesAny,
        Operator.IncludesAll,
        Operator.IncludesNone,
        Operator.IsEmpty,
        Operator.IsNotEmpty,
        Operator.IsSet,
        Operator.IsNotSet,
      ),
    },
  ],
  /** A point on the earth. */
  Geo: [
    "geo",
    {
      operators: set(
        Operator.WithinRadius,
        Operator.OutsideRadius,
        Operator.IsSet,
        Operator.IsNotSet,
      ),
    },
  ],
});

/** One of the codes above. */
export type FieldType = Enum.Value<typeof FieldType>;
