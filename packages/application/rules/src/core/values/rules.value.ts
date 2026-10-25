/**
 * Stackra file contract:
 * Purpose: `Rules`, one consumer's registry of fact sources: the fields its rules may test, and the check that turns
 *          a user-written condition into a `Condition` or refuses it, node by node.
 * Boundary: a value built with `Rules.create`, frozen. A misdeclared source (a bad key, a repeated source, an enum
 *           without values) is the consumer's bug and throws a `TypeError` at module load. The check is the trust
 *           boundary for stored rules: a tree of at most 200 nodes and 8 levels, each leaf a registered field, an
 *           operator of its type's set and a value that operator takes (`fitsOperand`). It never evaluates anything.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decisions 2, 3, 4 and 10); ADR 0328 (values are built with `create`); ADR 0140
 *                     (field errors by path).
 */
import { Enum } from "@stackra/contracts";
import type { FieldErrors } from "@stackra/errors";

import { type FactField, type FactSource, FieldType, type Operator } from "#contracts/index";
import { ConditionInvalidError } from "#core/errors/condition-invalid.error";
import { fitsOperand } from "#core/functions/fits-operand.function";
import { isRecord } from "#core/functions/is-record.function";
import type { Condition } from "#core/types/condition.type";
import type { RuleField } from "#core/types/rule-field.type";
import type { RulesOptions } from "#core/types/rules-options.type";

/** A consumer key: a module key, a dot, a snake_case name (`promotions.discount`). */
const CONSUMER_KEY = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

/** A camelCase source or field key of 1 to 63 characters. */
const KEY = /^[a-z][a-zA-Z0-9]{0,62}$/;

/** The deepest a tree may nest, the root counting as 1. */
const MAX_DEPTH = 8;

/** The most nodes a tree may hold. */
const MAX_NODES = 200;

/** The keys a leaf may carry. */
const LEAF_KEYS = ["field", "operator", "value"] as const;

/** The path of a child: the parent's path, a dot and the child's segment. */
const join = (path: string, segment: string): string =>
  path === "" ? segment : `${path}.${segment}`;

/** The field description of each path of `sources`, after checking every declaration. */
function fieldsOf(sources: readonly FactSource[]): Map<string, FactField> {
  if (sources.length === 0) throw new TypeError("Rules.create: register at least one fact source");
  const fields = new Map<string, FactField>();
  const seen = new Set<string>();
  for (const source of sources) {
    if (!KEY.test(source.key) || seen.has(source.key))
      throw new TypeError(`Rules.create: "${source.key}" is not a distinct camelCase source key`);
    seen.add(source.key);
    const entries = Object.entries(source.fields);
    if (entries.length === 0)
      throw new TypeError(`Rules.create: the fact source "${source.key}" has no field`);
    for (const [key, field] of entries) {
      const path = `${source.key}.${key}`;
      if (!KEY.test(key))
        throw new TypeError(`Rules.create: "${path}" is not a camelCase field key`);
      if (!Enum.values(FieldType).includes(field.type))
        throw new TypeError(`Rules.create: "${path}" has no FieldType`);
      const isEnum = field.type === FieldType.Enum;
      if (
        isEnum !== (field.values !== undefined) ||
        (isEnum && Object.keys(field.values ?? {}).length === 0)
      )
        throw new TypeError(
          `Rules.create: "${path}": an enum field, and only one, lists its values`,
        );
      fields.set(path, field);
    }
  }
  return fields;
}

/**
 * The fields one consumer's rules may test.
 *
 * @example
 * export const DISCOUNT_RULES = Rules.create({ key: "promotions.discount", sources: [CART_FACTS, CUSTOMER_FACTS] });
 * const condition = DISCOUNT_RULES.check(input.condition); // throws ConditionInvalidError
 */
export class Rules {
  /** The consumer's key, stored on its rule sets. */
  readonly key: string;

  /** The fact sources, in the order they were given. */
  readonly sources: readonly FactSource[];

  /** Each registered field by its path. */
  private readonly byPath: ReadonlyMap<string, FactField>;

  private constructor(
    key: string,
    sources: readonly FactSource[],
    byPath: ReadonlyMap<string, FactField>,
  ) {
    this.key = key;
    this.sources = sources;
    this.byPath = byPath;
    Object.freeze(this);
  }

  /**
   * The registry of `options.sources` for the consumer `options.key`.
   *
   * @throws TypeError when the key is not a consumer key, no source is given, a source key is repeated or not
   *         camelCase, a source has no field, a field key is not camelCase or its type is not a `FieldType`, or an
   *         enum field lists no values (or another field lists some).
   */
  static create(options: RulesOptions): Rules {
    if (!CONSUMER_KEY.test(options.key))
      throw new TypeError(
        `Rules.create: "${options.key}" is not a consumer key such as "promotions.discount"`,
      );
    return new Rules(options.key, Object.freeze([...options.sources]), fieldsOf(options.sources));
  }

  /** Every registered field with its path, source by source, in declaration order. */
  fields(): RuleField[] {
    return [...this.byPath].map(([path, field]) => ({ path, field }));
  }

  /** The field registered at `path` (`cart.total`), or `undefined`. */
  fieldOf(path: string): FactField | undefined {
    return this.byPath.get(path);
  }

  /**
   * What is wrong with `input` as a condition of these fields, by node path (`(root)` for the root); `{}` when
   * nothing is. A node reports its first problem only.
   */
  problems(input: unknown): FieldErrors {
    const errors: Record<string, string> = {};
    let count = 0;
    const visit = (node: unknown, path: string, depth: number): void => {
      const at = path === "" ? "(root)" : path;
      count += 1;
      if (count > MAX_NODES) {
        errors["(root)"] = "too_many_nodes";
        return;
      }
      if (depth > MAX_DEPTH) {
        errors[at] = "too_deep";
        return;
      }
      const keys =
        typeof node === "object" && node !== null && !Array.isArray(node) ? Object.keys(node) : [];
      const [only] = keys;
      const group = node as Readonly<Record<string, unknown>>;
      if (keys.length === 1 && (only === "all" || only === "any")) {
        const children = group[only];
        if (!Array.isArray(children)) errors[at] = "node_invalid";
        else
          (children as readonly unknown[]).forEach((child, index) =>
            visit(child, join(path, `${only}.${index}`), depth + 1),
          );
        return;
      }
      if (keys.length === 1 && only === "not") {
        visit(group["not"], join(path, "not"), depth + 1);
        return;
      }
      if (
        !isRecord(node, LEAF_KEYS) ||
        typeof node["field"] !== "string" ||
        typeof node["operator"] !== "string"
      ) {
        errors[at] = "node_invalid";
        return;
      }
      const field = this.byPath.get(node["field"]);
      const operator = node["operator"];
      if (field === undefined) errors[at] = "field_unknown";
      else if (
        !(Enum.meta(FieldType, field.type).operators as readonly string[]).includes(operator)
      )
        errors[at] = "operator_not_allowed";
      // reason: the line above proved `operator` is a code of the field type's operator set
      else if (!fitsOperand(field, operator as Operator, node["value"]))
        errors[at] = "value_invalid";
    };
    visit(input, "", 1);
    return errors;
  }

  /**
   * `input` as a `Condition` of these fields.
   *
   * @throws ConditionInvalidError with one field error per refused node (see `problems`).
   */
  check(input: unknown): Condition {
    const fieldErrors = this.problems(input);
    if (Object.keys(fieldErrors).length > 0)
      throw ConditionInvalidError.create({}, { fieldErrors });
    // reason: `problems` found nothing, so every node is one of the shapes `Condition` names
    return input as Condition;
  }
}
