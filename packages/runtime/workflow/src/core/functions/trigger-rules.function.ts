/**
 * Stackra file contract:
 * Purpose: `triggerRules`, the `@stackra/rules` registry of a trigger block's facts (source `trigger`, consumer
 *          `workflow.automation`), which checks and evaluates a step's `when`.
 * Boundary: internal; cached per block. One evaluator for every condition (ADR 0331 decision 1): an automation's
 *           condition is a rules condition, never a second walk.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decisions 1, 4 and 9: automations are a rule consumer); ADR 0122 (decision 3).
 */
import { Rules } from "@stackra/rules";

import type { BuildingBlock } from "#core/types/building-block.type";

/** The registries built so far. */
const CACHE = new WeakMap<BuildingBlock, Rules>();

/**
 * The rules of `block`'s facts.
 *
 * @throws TypeError when the block declares no facts.
 * @example
 * triggerRules(ORDER_PAID).check({ field: "trigger.total", operator: Operator.AtLeast, value: 100 });
 */
export function triggerRules(block: BuildingBlock): Rules {
  const known = CACHE.get(block);
  if (known !== undefined) return known;
  if (block.facts === undefined) throw new TypeError(`${block.key} declares no facts`);
  const rules = Rules.create({
    key: "workflow.automation",
    sources: [{ key: "trigger", fields: block.facts }],
  });
  CACHE.set(block, rules);
  return rules;
}
