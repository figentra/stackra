/**
 * Stackra file contract:
 * Purpose: `Rules`, one consumer's registry of fact sources and outcome kinds: the fields its rules may test, the
 *          outcomes a match may yield, and the checks that turn a user-written condition into a `Condition` and
 *          user-written outcomes into `Outcome`s, or refuse them, node by node.
 * Boundary: a value built with `Rules.create`, frozen. A misdeclared source or outcome kind (a bad key, a repeat, an
 *           enum without values, a floor on a parameter that is not a number) is the consumer's bug and throws a
 *           `TypeError` at module load. The checks are the trust boundary for stored rules: a tree of at most 200 nodes
 *           and 8 levels, each leaf a registered field, an operator of its type's set and a value that operator takes
 *           (`fitsOperand`); at most 20 outcomes, each a registered kind with every parameter and a fitting value. It
 *           never evaluates or applies anything.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decisions 2, 3, 4, 9 and 10); ADR 0328 (values are built with `create`); ADR 0140
 *                     (field errors by path).
 */
import { Enum } from "@stackra/contracts";
import type { FieldErrors } from "@stackra/errors";

import {
  type FactField,
  type FactSource,
  FieldType,
  Operator,
  type OutcomeKind,
} from "#contracts/index";
import { ConditionInvalidError } from "#core/errors/condition-invalid.error";
import { OutcomeInvalidError } from "#core/errors/outcome-invalid.error";
import { fitsOperand } from "#core/functions/fits-operand.function";
import { isRecord } from "#core/functions/is-record.function";
import type { Condition } from "#core/types/condition.type";
import type { Outcome } from "#core/types/outcome.type";
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

/** The most outcomes one rule may yield. */
const MAX_OUTCOMES = 20;

/** The keys an outcome carries. */
const OUTCOME_KEYS = ["kind", "params"] as const;

/** A market-pack floor key: a dotted lowercase path. */
const FLOOR_KEY = /^[a-z0-9_]+(\.[a-z0-9_]+)*$/;

/** The path of a child: the parent's path, a dot and the child's segment. */
const join = (path: string, segment: string): string =>
  path === "" ? segment : `${path}.${segment}`;

/**
 * Checks one declared field (a fact field or an outcome parameter) at `path`.
 *
 * @throws TypeError for a key that is not camelCase, a type that is not a `FieldType`, or enum values on the wrong type.
 */
function checkField(path: string, key: string, field: FactField): void {
  if (!KEY.test(key)) throw new TypeError(`Rules.create: "${path}" is not a camelCase field key`);
  if (!Enum.values(FieldType).includes(field.type))
    throw new TypeError(`Rules.create: "${path}" has no FieldType`);
  const isEnum = field.type === FieldType.Enum;
  if (
    isEnum !== (field.values !== undefined) ||
    (isEnum && Object.keys(field.values ?? {}).length === 0)
  )
    throw new TypeError(`Rules.create: "${path}": an enum field, and only one, lists its values`);
}

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
      checkField(path, key, field);
      fields.set(path, field);
    }
  }
  return fields;
}

/** Each outcome kind of `kinds` by its key, after checking every declaration. */
function kindsOf(kinds: readonly OutcomeKind[]): Map<string, OutcomeKind> {
  const byKey = new Map<string, OutcomeKind>();
  for (const kind of kinds) {
    if (!KEY.test(kind.key) || byKey.has(kind.key))
      throw new TypeError(`Rules.create: "${kind.key}" is not a distinct camelCase outcome key`);
    for (const [key, param] of Object.entries(kind.params)) {
      const path = `${kind.key}.${key}`;
      checkField(path, key, param);
      if (param.type === FieldType.Geo)
        throw new TypeError(`Rules.create: "${path}": an outcome parameter is never a geo point`);
      if (
        param.floor !== undefined &&
        (param.type !== FieldType.Number || !FLOOR_KEY.test(param.floor))
      )
        throw new TypeError(
          `Rules.create: "${path}": only a number parameter names a floor, as a dotted lowercase key`,
        );
    }
    byKey.set(kind.key, kind);
  }
  return byKey;
}

/** Whether `value` fits `param`: one element of its type, or for a list one to a hundred strings. */
const fitsParam = (param: FactField, value: unknown): boolean =>
  fitsOperand(param, param.type === FieldType.List ? Operator.IncludesAll : Operator.Equals, value);

/**
 * The fields one consumer's rules may test, and the outcomes a match may yield.
 *
 * @example
 * export const DISCOUNT_RULES = Rules.create({ key: "promotions.discount", sources: [CART_FACTS, CUSTOMER_FACTS] });
 * const condition = DISCOUNT_RULES.check(input.condition); // throws ConditionInvalidError
 * const outcomes = RETURNS_RULES.checkOutcomes(input.outcomes); // throws OutcomeInvalidError
 */
export class Rules {
  /** The consumer's key, stored on its rule sets. */
  readonly key: string;

  /** The fact sources, in the order they were given. */
  readonly sources: readonly FactSource[];

  /** Each registered field by its path. */
  private readonly byPath: ReadonlyMap<string, FactField>;

  /** Each registered outcome kind by its key. */
  private readonly kinds: ReadonlyMap<string, OutcomeKind>;

  private constructor(
    key: string,
    sources: readonly FactSource[],
    byPath: ReadonlyMap<string, FactField>,
    kinds: ReadonlyMap<string, OutcomeKind>,
  ) {
    this.key = key;
    this.sources = sources;
    this.byPath = byPath;
    this.kinds = kinds;
    Object.freeze(this);
  }

  /**
   * The registry of `options.sources` for the consumer `options.key`.
   *
   * @throws TypeError when the key is not a consumer key, no source is given, a source key is repeated or not
   *         camelCase, a source has no field, a field key is not camelCase or its type is not a `FieldType`, or an
   *         enum field lists no values (or another field lists some); or when an outcome kind key is repeated or not
   *         camelCase, a parameter is misdeclared the same ways or is a geo point, or a floor sits on a parameter that
   *         is not a number.
   */
  static create(options: RulesOptions): Rules {
    if (!CONSUMER_KEY.test(options.key))
      throw new TypeError(
        `Rules.create: "${options.key}" is not a consumer key such as "promotions.discount"`,
      );
    return new Rules(
      options.key,
      Object.freeze([...options.sources]),
      fieldsOf(options.sources),
      kindsOf(options.outcomes ?? []),
    );
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

  /** Every registered outcome kind, in declaration order. */
  outcomeKinds(): OutcomeKind[] {
    return [...this.kinds.values()];
  }

  /** The outcome kind registered under `key` (`refundWindow`), or `undefined`. */
  outcomeKind(key: string): OutcomeKind | undefined {
    return this.kinds.get(key);
  }

  /**
   * What is wrong with `input` as outcomes of these kinds, by path (`0`, `1.params.days`, `(root)`); `{}` when nothing
   * is. An outcome reports each parameter's first problem.
   */
  outcomeProblems(input: unknown): FieldErrors {
    if (!Array.isArray(input)) return { "(root)": "node_invalid" };
    if (input.length > MAX_OUTCOMES) return { "(root)": "too_many_outcomes" };
    const errors: Record<string, string> = {};
    (input as readonly unknown[]).forEach((outcome, index) => {
      const at = String(index);
      const params = isRecord(outcome, OUTCOME_KEYS) ? outcome["params"] : undefined;
      if (
        !isRecord(outcome, OUTCOME_KEYS) ||
        typeof outcome["kind"] !== "string" ||
        typeof params !== "object" ||
        params === null ||
        Array.isArray(params)
      ) {
        errors[at] = "node_invalid";
        return;
      }
      const kind = this.kinds.get(outcome["kind"]);
      if (kind === undefined) {
        errors[at] = "kind_unknown";
        return;
      }
      const values = params as Readonly<Record<string, unknown>>;
      for (const name of Object.keys(values))
        if (!Object.hasOwn(kind.params, name)) errors[`${at}.params.${name}`] = "param_unknown";
      for (const [name, param] of Object.entries(kind.params))
        if (values[name] === undefined) errors[`${at}.params.${name}`] = "param_missing";
        else if (!fitsParam(param, values[name])) errors[`${at}.params.${name}`] = "value_invalid";
    });
    return errors;
  }

  /**
   * `input` as `Outcome`s of these kinds.
   *
   * @throws OutcomeInvalidError with one field error per refused outcome or parameter (see `outcomeProblems`).
   */
  checkOutcomes(input: unknown): Outcome[] {
    const fieldErrors = this.outcomeProblems(input);
    if (Object.keys(fieldErrors).length > 0) throw OutcomeInvalidError.create({}, { fieldErrors });
    // reason: `outcomeProblems` found nothing, so every element is a registered kind with fitting parameters
    return [...(input as readonly Outcome[])];
  }
}
