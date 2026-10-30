/**
 * Stackra file contract:
 * Purpose: proves `ruleMatches` per operator: emptiness, the negative operators passing an empty value, numeric
 *          greater and less (refusing text that is not a number), equality by number or by folded Arabic text, and
 *          contains / not contains.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0022 (test placement); STA-1371.
 */
import type { RuleOperator } from "#contracts/enums/rule-operator.enum";
import { ruleMatches } from "#core/functions/rule-matches.function";

const RECORD = { total: 120, city: "الرياض", code: "A-1", note: "  ", missing: null };

/** Whether one condition holds for the record. */
const holds = (field: string, operator: RuleOperator, value = "") =>
  ruleMatches({ match: "all", conditions: [{ id: "1", field, operator, value }] }, RECORD);

describe("ruleMatches", () => {
  it.each<[string, RuleOperator, string, boolean]>([
    ["note", "is_empty", "", true],
    ["missing", "is_empty", "", true],
    ["city", "is_empty", "", false],
    ["note", "is_not_empty", "", false],
    ["note", "not_equals", "x", true],
    ["note", "not_contains", "x", true],
    ["note", "equals", "", false],
    ["note", "contains", "", false],
    ["total", "greater", "100", true],
    ["total", "greater", "120", false],
    ["total", "less", "121", true],
    ["total", "less", "abc", false],
    ["city", "greater", "1", false],
    ["total", "equals", "120", true],
    ["total", "equals", "120.0", true],
    ["total", "not_equals", "120", false],
    ["total", "not_equals", "7", true],
    ["city", "equals", "الرياض", true],
    ["city", "equals", "الرياضِ", true],
    ["code", "not_equals", "a-1", false],
    ["code", "not_equals", "B-2", true],
    ["city", "contains", "رياض", true],
    ["city", "not_contains", "جدة", true],
    ["city", "not_contains", "رياض", false],
  ])("%s %s %j is %s", (field, operator, value, expected) => {
    expect(holds(field, operator, value)).toBe(expected);
  });

  it("needs every condition for all and one for any", () => {
    const conditions = [
      { id: "1", field: "total", operator: "greater" as const, value: "500" },
      { id: "2", field: "city", operator: "contains" as const, value: "رياض" },
    ];
    expect(ruleMatches({ match: "all", conditions }, RECORD)).toBe(false);
    expect(ruleMatches({ match: "any", conditions }, RECORD)).toBe(true);
  });
});
