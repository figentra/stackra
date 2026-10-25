/**
 * Stackra file contract:
 * Purpose: `Skill({ tools })`, the kind base of an agent skill in a module's `ai/` group: the tools an agent may call
 *          while the skill is loaded, and its few-shot `examples`. The interface of the same name is its instance side.
 * Boundary: called only (the tools are required). The instructions are the module asset `<module>::ai/<stem>.md`,
 *           bound by the stem and loaded on demand (progressive disclosure); gen writes them and the tools' locked keys
 *           into the skill table of `#stackra/ai`. When called it refuses a tool that is not an exposed tool (a query
 *           with `tool: false`, an action without `tool: true`, any other class) or that is listed twice; the risk of
 *           each tool is its permission's and is gen's to check. No state, no dependencies.
 * Runtime: isomorphic
 * Governing contract: ADR 0245 (decision 5, as amended by ADR 0294 and ADR 0305); ADR 0155 (decision 1); ADR 0294
 *                     (decisions 13, 16 and 25); ADR 0305 (rules 2, 3 and 28).
 */
import { createKind, kindOf } from "@stackra/container";

import type { SkillClass } from "#core/types/skill-class.type";
import type { SkillExample } from "#core/types/skill-example.type";
import type { SkillOptions } from "#core/types/skill-options.type";

/** The instance side every skill shares. */
export interface Skill {
  /** Type-only kind brand, so a class of another kind cannot stand in for a skill. */
  readonly "~kind": "skill";

  /** Few-shot examples; each call names its tool by class. */
  readonly examples?: readonly SkillExample[];
}

/** Whether `type` is a query that is a tool or an action with `tool: true`. */
function isExposedTool(type: unknown): boolean {
  if (typeof type !== "function") return false;
  const record = kindOf(type);
  if (record?.kind === "query") return record.options["tool"] !== false;
  return record?.kind === "action" && record.options["tool"] === true;
}

/** Checks the options of a skill. */
function read(options: SkillOptions) {
  const tools: readonly unknown[] = options.tools;
  if (!Array.isArray(tools)) throw new TypeError("Skill({ tools }) lists action and query classes");
  for (const tool of tools)
    if (!isExposedTool(tool))
      throw new TypeError(
        `Skill({ tools }) lists exposed tools: ${(tool as { name?: string } | null)?.name ?? String(tool)} is not one (a query with tool: false, or an action without tool: true)`,
      );
  if (new Set(tools).size !== tools.length)
    throw new TypeError("Skill({ tools }) lists each tool once");
  return { ...options, tools: Object.freeze([...options.tools]) };
}

/**
 * The skill kind base.
 *
 * @example
 * export class OrdersSupportSkill extends Skill({
 *   tools: [GetOrderQuery, ListOrdersQuery, CancelOrderAction],
 * }) {
 *   readonly examples = [
 *     {
 *       input: "cancel my last order",
 *       calls: [
 *         { tool: ListOrdersQuery, input: { limit: 1 } },
 *         { tool: CancelOrderAction, input: { orderId: "$0.items[0].id" } },
 *       ],
 *     },
 *   ];
 * }
 */
export const Skill = createKind(
  "skill",
  // The runtime base: empty, so a skill class keeps no state of its own.
  // oxlint-disable-next-line typescript/no-extraneous-class -- reason: a kind base is empty on purpose (0294 d25)
  class SkillBase {},
  read,
) as (options: SkillOptions) => SkillClass;
