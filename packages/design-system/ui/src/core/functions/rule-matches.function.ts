/**
 * Stackra file contract:
 * Purpose: `ruleMatches`, whether a record meets a rule: all (or any) of its conditions hold. Text compares folded
 *          (case, accents, Arabic diacritics); numbers compare as numbers. A rule with no conditions matches.
 * Boundary: pure; the same evaluation a server runs on the stored rule.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { RuleCondition } from "#contracts/types/rule-condition.type";
import type { RuleGroup } from "#contracts/types/rule-group.type";
import { normalizeSearchText } from "#core/functions/normalize-search-text.function";

/** Whether one condition holds for `actual`. */
function holds(condition: RuleCondition, actual: unknown): boolean {
  const isEmpty = actual === null || actual === undefined || String(actual).trim() === "";
  if (condition.operator === "is_empty") return isEmpty;
  if (condition.operator === "is_not_empty") return !isEmpty;
  if (isEmpty) return condition.operator === "not_equals" || condition.operator === "not_contains";
  if (condition.operator === "greater" || condition.operator === "less") {
    const [left, right] = [Number(actual), Number(condition.value)];
    if (Number.isNaN(left) || Number.isNaN(right)) return false;
    return condition.operator === "greater" ? left > right : left < right;
  }
  const [left, right] = [normalizeSearchText(String(actual)), normalizeSearchText(condition.value)];
  switch (condition.operator) {
    case "equals": {
      return typeof actual === "number" ? actual === Number(condition.value) : left === right;
    }
    case "not_equals": {
      return typeof actual === "number" ? actual !== Number(condition.value) : left !== right;
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
