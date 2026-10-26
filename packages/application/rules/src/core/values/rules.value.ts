/**
 * Stackra file contract:
 * Purpose: `Rules`, one consumer's registry of fact sources and outcome kinds: the fields its rules may test, the
 *          outcomes a match may yield, and the checks that turn a user-written condition into a `Condition` and
 *          user-written outcomes into `Outcome`s, or refuse them, node by node.
 * Boundary: a value built with `Rules.create`, frozen. A misdeclared source or outcome kind (a bad key, a repeat, an
 *           enum without values, a floor on a parameter that is not a number) is the consumer's bug and throws a
 *           `TypeError` at module load. The checks are the trust boundary for stored rules: a tree of at most 200 nodes
 *           and 8 levels, each leaf a registered field, an operator of its type's set and a value that operator takes
 *           (`fitsOperand`, through `conditionProblems`); at most 20 outcomes (or the consumer's `maxOutcomes`, up to 500), each a registered
 *           kind with every required parameter and a fitting value, and, at a save, none past a market floor. It never evaluates or applies
 *           anything. Outcome kinds come as data or as declared `RuleOutcome` classes.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decisions 2, 3, 4, 9 and 10); ADR 0328 (values are built with `create`); ADR 0140
 *                     (field errors by path); ADR 0425 (decisions 1 to 4); config-model sections 3 and 4;
 *                     STA-1250 (one key casing, `FIELD_KEY`).
 */
import { Enum } from "@stackra/contracts";
import type { FieldErrors } from "@stackra/errors";
import type { ResolvedValue } from "@stackra/market-packs";
import { z } from "zod";

import {
  type FactField,
  type FactSource,
  FIELD_KEY,
  FieldType,
  Operator,
  type OutcomeKind,
} from "#contracts/index";
import { ConditionInvalidError } from "#core/errors/condition-invalid.error";
import { OutcomeInvalidError } from "#core/errors/outcome-invalid.error";
import { conditionProblems } from "#core/functions/condition-problems.function";
import { crossedFloor } from "#core/functions/crossed-floor.function";
import { fitsOperand } from "#core/functions/fits-operand.function";
import { isRecord } from "#core/functions/is-record.function";
import { outcomeKindOf } from "#core/functions/outcome-kind-of.function";
import type { Condition } from "#core/types/condition.type";
import type { Outcome } from "#core/types/outcome.type";
import type { RuleField } from "#core/types/rule-field.type";
import type { RulesOptions } from "#core/types/rules-options.type";

/** A consumer key: a module key, a dot, a snake_case name (`promotions.discount`). */
const CONSUMER_KEY = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

/** A source, field, outcome kind or parameter key: the one casing every registry shares. */
const KEY = FIELD_KEY;

/** The most outcomes one rule may yield, unless the consumer raises it (`RulesOptions.maxOutcomes`). */
const MAX_OUTCOMES = 20;

/** The most a consumer may raise it to (a permission matrix's rows). */
const MAX_OUTCOMES_CEILING = 500;

/** The keys an outcome carries. */
const OUTCOME_KEYS = ["kind", "params"] as const;

/** A market-pack floor key: a dotted lowercase path. */
const FLOOR_KEY = /^[a-z0-9_]+(\.[a-z0-9_]+)*$/;

/**
 * Checks one declared field (a fact field or an outcome parameter) at `path`.
 *
 * @throws TypeError for a key that is not camelCase, a type that is not a `FieldType`, or enum values on the wrong type.
 */
function checkField(path: string, key: string, field: FactField): void {
  if (!KEY.test(key))
    throw new TypeError(
      `Rules.create: "${path}" is not a camelCase field key (one casing: channelId, never channel_id)`,
    );
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
        ((param.type !== FieldType.Number && param.type !== FieldType.Money) ||
          !FLOOR_KEY.test(param.floor))
      )
        throw new TypeError(
          `Rules.create: "${path}": only a number or money parameter names a floor, as a dotted lowercase key`,
        );
      if (param.floor !== undefined && param.optional === true)
        throw new TypeError(`Rules.create: "${path}": a floored parameter is never optional`);
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

  /** The most outcomes one rule may yield. */
  private readonly maxOutcomes: number;

  private constructor(
    key: string,
    sources: readonly FactSource[],
    byPath: ReadonlyMap<string, FactField>,
    kinds: ReadonlyMap<string, OutcomeKind>,
    maxOutcomes: number,
  ) {
    this.key = key;
    this.sources = sources;
    this.byPath = byPath;
    this.kinds = kinds;
    this.maxOutcomes = maxOutcomes;
    Object.freeze(this);
  }

  /**
   * The registry of `options.sources` for the consumer `options.key`.
   *
   * @throws TypeError when the key is not a consumer key, no source is given, a source key is repeated or not
   *         camelCase, a source has no field, a field key is not camelCase or its type is not a `FieldType`, or an
   *         enum field lists no values (or another field lists some); or when an outcome kind key is repeated or not
   *         camelCase, a parameter is misdeclared the same ways or is a geo point, or a floor sits on a parameter that
   *         is not a number or is optional; or when `maxOutcomes` is not a whole number from 1 to 500.
   */
  static create(options: RulesOptions): Rules {
    if (!CONSUMER_KEY.test(options.key))
      throw new TypeError(
        `Rules.create: "${options.key}" is not a consumer key such as "promotions.discount"`,
      );
    const maxOutcomes = options.maxOutcomes ?? MAX_OUTCOMES;
    if (!Number.isInteger(maxOutcomes) || maxOutcomes < 1 || maxOutcomes > MAX_OUTCOMES_CEILING)
      throw new TypeError(
        `Rules.create: maxOutcomes must be a whole number from 1 to ${MAX_OUTCOMES_CEILING}`,
      );
    return new Rules(
      options.key,
      Object.freeze([...options.sources]),
      fieldsOf(options.sources),
      kindsOf((options.outcomes ?? []).map(outcomeKindOf)),
      maxOutcomes,
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
    return conditionProblems(input, (path) => this.byPath.get(path));
  }

  /**
   * A zod schema of a condition of these fields, for an action's input: it refuses what `problems` reports, each
   * problem at its node's path, so the field registry is checked at write time by the input validation itself.
   *
   * @example
   * const input = z.object({ condition: SEGMENT_RULES.conditionSchema() });
   */
  conditionSchema(): z.ZodType<Condition> {
    return z
      .json()
      .superRefine((value, ctx) => {
        for (const [path, code] of Object.entries(this.problems(value)))
          ctx.addIssue({
            code: "custom",
            message: code,
            path: path === "(root)" ? [] : path.split("."),
          });
      })
      .transform((value) => value as Condition) as unknown as z.ZodType<Condition>;
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
    if (input.length > this.maxOutcomes) return { "(root)": "too_many_outcomes" };
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
        if (values[name] === undefined) {
          if (param.optional !== true) errors[`${at}.params.${name}`] = "param_missing";
        } else if (!fitsParam(param, values[name]))
          errors[`${at}.params.${name}`] = "value_invalid";
    });
    return errors;
  }

  /**
   * Which parameters of checked `outcomes` cross a floor of `floors`, by path (`0.params.days`): `past_floor`, or
   * `currency_mismatch` for a money amount in another currency than the floor's; `{}` when none does. The rules
   * studio refuses these at save time; `guardFloors` would move them to the floor at decision time.
   *
   * @throws TypeError when a floor's pack value does not fit its parameter (a pack bug).
   */
  floorProblems(outcomes: readonly Outcome[], floors: readonly ResolvedValue[]): FieldErrors {
    const byKey = new Map(floors.map((floor) => [floor.key, floor]));
    const errors: Record<string, string> = {};
    outcomes.forEach((outcome, index) => {
      const kind = this.kinds.get(outcome.kind);
      for (const [name, param] of Object.entries(kind?.params ?? {})) {
        const floor = param.floor === undefined ? undefined : byKey.get(param.floor);
        const crossing =
          floor === undefined ? undefined : crossedFloor(param.type, outcome.params[name], floor);
        if (crossing !== undefined) errors[`${index}.params.${name}`] = crossing.reason;
      }
    });
    return errors;
  }

  /**
   * `input` as `Outcome`s of these kinds; given `floors` (a save in the rules studio), also refused when a parameter
   * crosses one.
   *
   * @throws OutcomeInvalidError with one field error per refused outcome or parameter (see `outcomeProblems` and
   *         `floorProblems`).
   */
  checkOutcomes(input: unknown, floors?: readonly ResolvedValue[]): Outcome[] {
    const fieldErrors = this.outcomeProblems(input);
    if (Object.keys(fieldErrors).length > 0) throw OutcomeInvalidError.create({}, { fieldErrors });
    // reason: `outcomeProblems` found nothing, so every element is a registered kind with fitting parameters
    const outcomes = [...(input as readonly Outcome[])];
    if (floors === undefined) return outcomes;
    const crossed = this.floorProblems(outcomes, floors);
    if (Object.keys(crossed).length > 0)
      throw OutcomeInvalidError.create({}, { fieldErrors: crossed });
    return outcomes;
  }
}
