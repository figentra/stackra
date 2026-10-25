/**
 * Stackra file contract:
 * Purpose: `conditionFields`, every field path a `@stackra/rules` condition tree tests.
 * Boundary: pure and internal; the decision point reads it to find the dimension fields a stored condition names.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decision 11); ADR 0351 (decision 3).
 */
import type { Condition } from "@stackra/rules";

/**
 * The fields `condition` tests.
 *
 * @example
 * conditionFields({ all: [{ field: "record.channel_id", operator: Operator.Equals, value: "chn_1" }] }); // Set {"record.channel_id"}
 */
export function conditionFields(condition: Condition): ReadonlySet<string> {
  const fields = new Set<string>();
  const walk = (node: Condition): void => {
    if ("all" in node) node.all.forEach(walk);
    else if ("any" in node) node.any.forEach(walk);
    else if ("not" in node) walk(node.not);
    else fields.add(node.field);
  };
  walk(condition);
  return fields;
}
