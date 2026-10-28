/**
 * Stackra file contract:
 * Purpose: `evaluate(rules, condition, facts, options)`, the one evaluator of condition trees: whether the condition
 *          holds for the facts at the given time, with every node explained by its path.
 * Boundary: deterministic and pure (ADR 0331 decision 6): it reads no clock, no store and no environment, and the
 *           same condition, facts, time and revision give the same result. The condition is checked against `rules`
 *           first, so a stored rule that names a field the consumer no longer registers is refused, never guessed.
 *           One reading of a missing fact everywhere: it matches `is_not_set` and nothing else. Strings compare
 *           exactly; a money amount in another currency fails with `currency_mismatch`; ranges include both ends;
 *           `within_last` holds from the current time minus the duration onwards; distances are great-circle
 *           kilometres. A fact of the wrong form is the consumer's bug and throws. The result is all it returns:
 *           what a match does is the consumer's (decision 9).
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decisions 1, 2, 3, 6, 7 and 9); ADR 0220 (money).
 */
import type { GeoPoint, Json } from "@stackra/contracts";
import { Money } from "@stackra/money";

import { type FactField, FieldType, Operator } from "#contracts/index";
import { millisecondsOf } from "#core/functions/milliseconds-of.function";
import { moneyOf } from "#core/functions/money-of.function";
import type { Condition } from "#core/types/condition.type";
import type { EvaluateOptions } from "#core/types/evaluate-options.type";
import type { Evaluation } from "#core/types/evaluation.type";
import type { EvaluationStep } from "#core/types/evaluation-step.type";
import type { FactValue } from "#core/types/fact-value.type";
import type { RuleFacts } from "#core/types/rule-facts.type";
import type { Rules } from "#core/values/rules.value";

/** The mean earth radius (IUGG), in kilometres. */
const EARTH_RADIUS_KILOMETRES = 6371.0088;

/** What a leaf reports beside its path, field and operator. */
type Outcome = Pick<EvaluationStep, "matched" | "reason">;

/** The path of a child: the parent's path, a dot and the child's segment. */
const join = (path: string, segment: string): string =>
  path === "" ? segment : `${path}.${segment}`;

/** Degrees as radians. */
const radians = (degrees: number): number => (degrees * Math.PI) / 180;

/** The great-circle distance between two points, in kilometres (haversine). */
function kilometresBetween(from: GeoPoint, to: GeoPoint): number {
  const latitudeDelta = radians(to.latitude - from.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);
  const half =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(from.latitude)) *
      Math.cos(radians(to.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_KILOMETRES * Math.asin(Math.min(1, Math.sqrt(half)));
}

/** Whether `fact` is the runtime form of `type`. */
function hasForm(type: FieldType, fact: FactValue): boolean {
  switch (type) {
    case FieldType.String:
    case FieldType.Enum: {
      return typeof fact === "string";
    }
    case FieldType.Number: {
      return typeof fact === "number" && Number.isFinite(fact);
    }
    case FieldType.Money: {
      return fact instanceof Money;
    }
    case FieldType.Date: {
      return fact instanceof Date && !Number.isNaN(fact.getTime());
    }
    case FieldType.List: {
      return (
        Array.isArray(fact) &&
        (fact as readonly unknown[]).every((item) => typeof item === "string")
      );
    }
    default: {
      const point = fact as Partial<GeoPoint>;
      return Number.isFinite(point.latitude) && Number.isFinite(point.longitude);
    }
  }
}

/** An ordered test of `fact` against `low` (and `high` for `between`). */
function compare(operator: Operator, fact: number, low: number, high: number): boolean {
  switch (operator) {
    case Operator.Equals: {
      return fact === low;
    }
    case Operator.NotEquals: {
      return fact !== low;
    }
    case Operator.LessThan:
    case Operator.Before: {
      return fact < low;
    }
    case Operator.AtMost: {
      return fact <= low;
    }
    case Operator.GreaterThan:
    case Operator.After: {
      return fact > low;
    }
    case Operator.AtLeast: {
      return fact >= low;
    }
    default: {
      return fact >= low && fact <= high;
    }
  }
}

/** A string or enum test. */
function testText(operator: Operator, fact: string, value: Json | undefined): boolean {
  const values = Array.isArray(value) ? (value as readonly Json[]) : [];
  const text = String(value);
  switch (operator) {
    case Operator.Equals: {
      return fact === text;
    }
    case Operator.NotEquals: {
      return fact !== text;
    }
    case Operator.OneOf: {
      return values.includes(fact);
    }
    case Operator.NotOneOf: {
      return !values.includes(fact);
    }
    case Operator.Contains: {
      return fact.includes(text);
    }
    case Operator.StartsWith: {
      return fact.startsWith(text);
    }
    default: {
      return fact.endsWith(text);
    }
  }
}

/** A list test. */
function testList(operator: Operator, fact: readonly string[], value: Json | undefined): boolean {
  const values = Array.isArray(value) ? (value as readonly Json[]) : [];
  switch (operator) {
    case Operator.Includes: {
      return fact.includes(String(value));
    }
    case Operator.IncludesAny: {
      return values.some((item) => fact.includes(String(item)));
    }
    case Operator.IncludesAll: {
      return values.every((item) => fact.includes(String(item)));
    }
    case Operator.IncludesNone: {
      return !values.some((item) => fact.includes(String(item)));
    }
    case Operator.IsEmpty: {
      return fact.length === 0;
    }
    default: {
      return fact.length > 0;
    }
  }
}

/** A money test; an operand in another currency fails it. */
function testMoney(operator: Operator, fact: Money, value: Json | undefined): Outcome {
  const [low, high = low] = (Array.isArray(value) ? (value as readonly Json[]) : [value]).map(
    moneyOf,
  );
  if (low === undefined || high === undefined) return { matched: false };
  if (low.currency !== fact.currency || high.currency !== fact.currency)
    return { matched: false, reason: "currency_mismatch" };
  return { matched: compare(operator, fact.minor, low.minor, high.minor) };
}

/** A date test at `now`. */
function testDate(operator: Operator, fact: Date, value: Json | undefined, now: number): boolean {
  const at = fact.getTime();
  if (operator === Operator.WithinLast || operator === Operator.NotWithinLast) {
    const since = now - (millisecondsOf(value) ?? 0);
    return operator === Operator.WithinLast ? at >= since : at < since;
  }
  const [low = Number.NaN, high = low] = (
    Array.isArray(value) ? (value as readonly Json[]) : [value]
  ).map((item) => Date.parse(String(item)));
  return compare(operator, at, low, high);
}

/** A geo test. */
function testGeo(operator: Operator, fact: GeoPoint, value: Json | undefined): boolean {
  const circle = value as { latitude: number; longitude: number; radiusKilometres: number };
  const inside = kilometresBetween(fact, circle) <= circle.radiusKilometres;
  return operator === Operator.WithinRadius ? inside : !inside;
}

/** One leaf against its fact. */
function testLeaf(
  path: string,
  field: FactField,
  operator: Operator,
  value: Json | undefined,
  fact: FactValue | null | undefined,
  now: number,
): Outcome {
  if (fact === null || fact === undefined)
    return operator === Operator.IsNotSet
      ? { matched: true }
      : { matched: false, reason: "missing" };
  if (!hasForm(field.type, fact))
    throw new TypeError(`evaluate: the fact "${path}" is not a ${field.type} value`);
  if (operator === Operator.IsSet || operator === Operator.IsNotSet)
    return { matched: operator === Operator.IsSet };
  // reason: `hasForm` proved the fact's form for the field type, and `Rules.check` the operand's
  switch (field.type) {
    case FieldType.String:
    case FieldType.Enum: {
      return { matched: testText(operator, fact as string, value) };
    }
    case FieldType.Number: {
      const [low = Number.NaN, high = low] = (Array.isArray(value) ? value : [value]).map(Number);
      return { matched: compare(operator, fact as number, low, high) };
    }
    case FieldType.Money: {
      return testMoney(operator, fact as Money, value);
    }
    case FieldType.Date: {
      return { matched: testDate(operator, fact as Date, value, now) };
    }
    case FieldType.List: {
      return { matched: testList(operator, fact as readonly string[], value) };
    }
    default: {
      return { matched: testGeo(operator, fact as GeoPoint, value) };
    }
  }
}

/**
 * Evaluates `condition` against `facts` at `options.now`.
 *
 * @param rules - the consumer's registry; the condition is checked against it first.
 * @param condition - the tree, usually a stored revision's.
 * @param facts - the facts, by source key and field key.
 * @param options - the current time, and the revision the explanation names.
 * @returns whether the root held, the revision, and one step per node, the root first.
 * @throws ConditionInvalidError when the condition does not check against `rules`.
 * @throws TypeError when `options.now` is not a valid `Date` or a fact is not of its field's form.
 *
 * @example
 * const result = evaluate(DISCOUNT_RULES, revision.condition, facts, { now: ctx.startedAt, revision: revision.number });
 * if (result.matched) applyDiscount(); // the consumer owns the outcome
 */
export function evaluate(
  rules: Rules,
  condition: Condition,
  facts: RuleFacts,
  options: EvaluateOptions,
): Evaluation {
  if (!(options.now instanceof Date) || Number.isNaN(options.now.getTime()))
    throw new TypeError("evaluate: options.now must be a valid Date");
  rules.check(condition);
  const now = options.now.getTime();
  const steps: EvaluationStep[] = [];
  const visit = (node: Condition, path: string): boolean => {
    const index = steps.length;
    steps.push({ path, matched: false }); // holds the node's place, so the steps read root first
    let step: EvaluationStep;
    if ("all" in node)
      step = {
        path,
        matched: node.all.map((child, at) => visit(child, join(path, `all.${at}`))).every(Boolean),
      };
    else if ("any" in node)
      step = {
        path,
        matched: node.any.map((child, at) => visit(child, join(path, `any.${at}`))).some(Boolean),
      };
    else if ("not" in node) step = { path, matched: !visit(node.not, join(path, "not")) };
    else {
      const dot = node.field.indexOf(".");
      const fact = facts[node.field.slice(0, dot)]?.[node.field.slice(dot + 1)];
      // reason: `rules.check` above refuses a leaf whose field is not registered
      const field = rules.fieldOf(node.field) as FactField;
      step = {
        path,
        field: node.field,
        operator: node.operator,
        ...testLeaf(node.field, field, node.operator, node.value, fact, now),
      };
    }
    steps[index] = step;
    return step.matched;
  };
  const matched = visit(condition, "");
  return { matched, revision: options.revision ?? null, steps };
}
