/**
 * Stackra file contract:
 * Purpose: `ruleMatches`, whether a record meets a rule: all (or any) of its conditions hold. Text compares folded
 *          (case, accents, Arabic diacritics); numbers compare as numbers; days compare as ISO text. `in` and `not_in`
 *          test a list of choice ids, `between` an inclusive `[from, to]` (an empty end is open), `before` and `after`
 *          exclusively, and `is_true` and `is_false` a flag (`true` or `"true"`). A rule with no conditions matches.
 * Boundary: pure; the same evaluation a server runs on the stored rule.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0505 (one filter model); STA-1371.
 */
import type { RuleCondition } from "#contracts/types/rule-condition.type";
import type { RuleGroup } from "#contracts/types/rule-group.type";
import type { RuleValue } from "#contracts/types/rule-value.type";
import { normalizeSearchText } from "#core/functions/normalize-search-text.function";

/** A value as one piece of text (a list joined). */
const textOf = (value: RuleValue): string => (typeof value === "string" ? value : value.join(","));

/** `actual` against a bound: below zero when it comes first. Numbers compare as numbers, anything else as ISO text. */
function compare(actual: unknown, bound: string): number {
  const [left, right] = [Number(actual), Number(bound)];
  if (typeof actual !== "boolean" && Number.isFinite(left) && Number.isFinite(right))
    return left - right;
  const text = actual instanceof Date ? actual.toISOString() : String(actual);
  // A day bound compares the day of a date-time.
  return text.slice(0, bound.length).localeCompare(bound);
}

/** Whether one condition holds for `actual`. */
function holds(condition: RuleCondition, actual: unknown): boolean {
  const { operator, value } = condition;
  const isEmpty = actual === null || actual === undefined || String(actual).trim() === "";
  if (operator === "is_empty") return isEmpty;
  if (operator === "is_not_empty") return !isEmpty;
  const isTrue = actual === true || actual === "true";
  if (operator === "is_true") return isTrue;
  if (operator === "is_false") return !isTrue;
  if (isEmpty)
    return operator === "not_equals" || operator === "not_contains" || operator === "not_in";
  if (operator === "in" || operator === "not_in") {
    const list = (typeof value === "string" ? [value] : value).map(normalizeSearchText);
    const isIn = list.includes(normalizeSearchText(String(actual)));
    return operator === "in" ? isIn : !isIn;
  }
  if (operator === "between") {
    const [from = "", to = ""] = typeof value === "string" ? [value] : value;
    return (from === "" || compare(actual, from) >= 0) && (to === "" || compare(actual, to) <= 0);
  }
  if (operator === "before" || operator === "after") {
    const bound = textOf(value);
    if (bound === "") return true;
    return operator === "before" ? compare(actual, bound) < 0 : compare(actual, bound) > 0;
  }
  if (operator === "greater" || operator === "less") {
    const [left, right] = [Number(actual), Number(textOf(value))];
    if (Number.isNaN(left) || Number.isNaN(right)) return false;
    return operator === "greater" ? left > right : left < right;
  }
  const [left, right] = [normalizeSearchText(String(actual)), normalizeSearchText(textOf(value))];
  switch (operator) {
    case "equals": {
      return typeof actual === "number" ? actual === Number(textOf(value)) : left === right;
    }
    case "not_equals": {
      return typeof actual === "number" ? actual !== Number(textOf(value)) : left !== right;
    }
    case "contains": {
      return left.includes(right);
    }
    default: {
      return !left.includes(right);
    }
  }
}

/** Whether `record` meets `rule`. */
export function ruleMatches(rule: RuleGroup, record: Readonly<Record<string, unknown>>): boolean {
  if (rule.conditions.length === 0) return true;
  const test = (condition: RuleCondition) => holds(condition, record[condition.field]);
  return rule.match === "all" ? rule.conditions.every(test) : rule.conditions.some(test);
}
