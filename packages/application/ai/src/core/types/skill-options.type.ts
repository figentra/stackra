/**
 * Stackra file contract:
 * Purpose: `SkillOptions`, what `Skill({...})` takes: the tools an agent may call while the skill is loaded, by class.
 * Boundary: a type only. The instructions are the module asset `<module>::ai/<stem>.md`, bound by name and never
 *           written here; the examples are the skill class's `examples` field. A tool is a query that is a tool (the
 *           default) or an action with `tool: true`; `Skill` refuses any other class when it is called.
 * Runtime: isomorphic
 * Governing contract: ADR 0245 (decision 5, as amended by ADR 0294 and ADR 0305); ADR 0155 (decision 1).
 */
import type { Action, Query } from "@stackra/actions";
import type { AnyClass } from "@stackra/container";

/** The options of a skill. */
export interface SkillOptions {
  /** The action and query classes the skill may call, each an exposed tool, each once. */
  readonly tools: readonly AnyClass<Action | Query>[];
}
