/**
 * Stackra file contract:
 * Purpose: `whereOf`, a visibility condition as the MikroORM filter of a read: `all`, `any` and `not` become `$and`,
 *          `$or` and `$not`, and each leaf over `record.<attribute>` the matching operator on that property, so the
 *          database returns exactly the rows `@stackra/rules`' `evaluate` would match.
 * Boundary: internal to the visibility filter driver, and the IAM evaluation path of ADR 0331 decision 11 as a query: it
 *           translates a condition the decision point already checked against the model's `Rules`, and decides
 *           nothing of its own. Every leaf but `is_set` and `is_not_set` also requires its column to be set, so a
 *           missing value matches `is_not_set` alone, under `not` as well, as in `evaluate`. An empty `all` (`{}`)
 *           matches every row and an empty `any` none (MikroORM renders `$or: []` as `1 = 0`, and `$not: {}` too); a
 *           group drops or absorbs a `{}` child, since MikroORM skips one inside an `$or` of several. A list field is the jsonb array
 *           gen stores a `string[]` in; a money field the embedded `minor` and `currency`, an amount in another
 *           currency never matching. Values are bound parameters, and a `like` pattern escapes `\`, `%` and `_`.
 * Runtime: node
 * Governing contract: ADR 0333 (decisions 2 and 4); ADR 0331 (decisions 3, 6 and 11); ADR 0220 (money); ADR 0160 (no
 *                     value in SQL text).
 */
import { Duration, type Json } from "@stackra/contracts";
import type { Where } from "@stackra/database/contracts";
import type { Condition, Rules } from "@stackra/rules";
import { FieldType, Operator } from "@stackra/rules/contracts";
import { duration } from "@stackra/validation";

/** A filter node under construction. */
type Filter = Record<string, unknown>;

/** Whether `filter` matches every row; MikroORM drops it from an `$or` of several, so it never reaches one. */
const isOpen = (filter: Filter): boolean => Reflect.ownKeys(filter).length === 0;

/** The fact source a model's attributes are registered under. */
const RECORD = "record.";

/** `text` as a `like` pattern that matches it literally. */
const literal = (text: string): string => text.replaceAll(/[\\%_]/g, (match) => `\\${match}`);

/** A text, number or instant test, keyed by operator; `value` is a pair for `between`. */
function scalarTest(operator: Operator, value: unknown): Filter {
  const [low, high] = Array.isArray(value) ? (value as readonly unknown[]) : [value, value];
  switch (operator) {
    case Operator.Equals: {
      return { $eq: value };
    }
    case Operator.NotEquals: {
      return { $ne: value };
    }
    case Operator.OneOf: {
      return { $in: value };
    }
    case Operator.NotOneOf: {
      return { $nin: value };
    }
    case Operator.Contains: {
      return { $like: `%${literal(String(value))}%` };
    }
    case Operator.StartsWith: {
      return { $like: `${literal(String(value))}%` };
    }
    case Operator.EndsWith: {
      return { $like: `%${literal(String(value))}` };
    }
    case Operator.LessThan:
    case Operator.Before: {
      return { $lt: low };
    }
    case Operator.AtMost: {
      return { $lte: low };
    }
    case Operator.GreaterThan:
    case Operator.After: {
      return { $gt: low };
    }
    case Operator.AtLeast: {
      return { $gte: low };
    }
    case Operator.Between: {
      return { $gte: low, $lte: high };
    }
    default: {
      throw new TypeError(`whereOf: ${operator} is not a text or number operator`);
    }
  }
}

/** The test of one leaf on `property`, set aside whether the column is set. */
function leafTest(
  property: string,
  type: FieldType,
  operator: Operator,
  value: Json | undefined,
  at: Date,
): Filter {
  switch (type) {
    case FieldType.String:
    case FieldType.Enum:
    case FieldType.Number: {
      return { [property]: scalarTest(operator, value) };
    }
    case FieldType.Money: {
      // reason: `Rules.check` proved each operand a money amount, and a range's two in one currency
      const amounts = (Array.isArray(value) ? value : [value]) as unknown as readonly {
        readonly minor: number;
        readonly currency: string;
      }[];
      const minors = amounts.map((amount) => amount.minor);
      return {
        [property]: {
          currency: amounts[0]?.currency,
          minor: scalarTest(operator, operator === Operator.Between ? minors : minors[0]),
        },
      };
    }
    case FieldType.Date: {
      if (operator === Operator.WithinLast || operator === Operator.NotWithinLast) {
        const since = new Date(at.getTime() - Duration.toMilliseconds(duration(String(value))));
        return { [property]: operator === Operator.WithinLast ? { $gte: since } : { $lt: since } };
      }
      const instants = (Array.isArray(value) ? value : [value]).map(
        (item) => new Date(String(item)),
      );
      return {
        [property]: scalarTest(operator, operator === Operator.Between ? instants : instants[0]),
      };
    }
    case FieldType.List: {
      switch (operator) {
        case Operator.Includes: {
          return { [property]: { $hasKey: value } };
        }
        case Operator.IncludesAny: {
          return { [property]: { $hasSomeKeys: value } };
        }
        case Operator.IncludesAll: {
          return { [property]: { $hasKeys: value } };
        }
        case Operator.IncludesNone: {
          return { $not: { [property]: { $hasSomeKeys: value } } };
        }
        case Operator.IsEmpty: {
          return { [property]: { $eq: [] } };
        }
        default: {
          return { $not: { [property]: { $eq: [] } } };
        }
      }
    }
    default: {
      // shortcut: registerVisibility refuses a geo attribute, since a read cannot test one yet; push ST_DWithin
      // through a raw fragment when a model needs a geo visibility rule.
      throw new TypeError(`whereOf: a ${type} attribute cannot filter a read`);
    }
  }
}

/** One leaf: the presence tests as they are, every other test only on a set column. */
function leafOf(
  field: string,
  operator: Operator,
  value: Json | undefined,
  rules: Rules | undefined,
  at: Date,
): Filter {
  const type = rules?.fieldOf(field)?.type;
  if (type === undefined || !field.startsWith(RECORD))
    throw new TypeError(`whereOf: "${field}" is not a registered record attribute`);
  const property = field.slice(RECORD.length);
  const column = type === FieldType.Money ? { [property]: { minor: null } } : { [property]: null };
  if (operator === Operator.IsNotSet) return column;
  const set = { $not: column };
  if (operator === Operator.IsSet) return set;
  return { $and: [set, leafTest(property, type, operator, value, at)] };
}

/**
 * The filter of the rows that meet `condition`.
 *
 * @param condition - a condition whose leaves `rules` registers, as `PolicyDecisionPointService.visibleCondition`
 *                    returns it.
 * @param rules - the model's attributes under the `record` fact source; absent when it registers none.
 * @param at - the current time relative date tests read.
 * @throws TypeError when a leaf names a field `rules` does not register under `record`, or a geo field.
 * @example
 * whereOf({ field: "record.collection", operator: Operator.Equals, value: "sale" }, PRODUCT_RULES, now);
 * // { $and: [{ $not: { collection: null } }, { collection: { $eq: "sale" } }] }
 */
export function whereOf<M extends object>(
  condition: Condition,
  rules: Rules | undefined,
  at: Date,
): Where<M> {
  const visit = (node: Condition): Filter => {
    if ("all" in node) {
      const parts = node.all.map(visit).filter((part) => !isOpen(part));
      return parts.length > 1 ? { $and: parts } : (parts[0] ?? {});
    }
    if ("any" in node) {
      const parts = node.any.map(visit);
      return parts.some(isOpen) ? {} : { $or: parts };
    }
    if ("not" in node) return { $not: visit(node.not) };
    return leafOf(node.field, node.operator, node.value, rules, at);
  };
  return visit(condition) as Where<M>;
}
