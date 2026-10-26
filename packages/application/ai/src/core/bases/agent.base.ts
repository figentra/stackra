/**
 * Stackra file contract:
 * Purpose: `Agent({ key, task, tools, maxSteps })`, the kind base of an AI agent: one class with `prompt`, `stream`,
 *          `queue` and `resume` (from `Promptable`), whose tools are actions and queries.
 * Boundary: called only (a key and a task are required). The options are checked, recorded in the kind registry with
 *           their defaults and kept in `AGENT_REGISTRY` by key; each tool must be an action or a query class. Whether a
 *           tool is exposed, and what the agent may do with it, is gen's and the runtime's (IAM, the permission matrix,
 *           the floor), never this base's.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decisions 2 and 3); ADR 0294 (decisions 16 and 25: kinds are bases); STA-781.
 */
import { createKind, kindOf } from "@stackra/container";

import { Promptable } from "#core/bases/promptable.base";
import { AGENT_REGISTRY } from "#core/constants/agent-registry.constant";
import type { AgentClass } from "#core/types/agent-class.type";
import type { AgentDefinition } from "#core/types/agent-definition.type";
import type { AgentOptions } from "#core/types/agent-options.type";

/** An agent key: snake_case. */
const KEY = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

/** The step limit when none is written. */
const DEFAULT_MAX_STEPS = 8;

/** Checks the options of an agent, applies their defaults and registers the definition by key. */
function read(options: AgentOptions): AgentDefinition {
  if (typeof options.key !== "string" || !KEY.test(options.key))
    throw new TypeError(
      `Agent({ key }) is snake_case such as "matter_assistant", got ${JSON.stringify(options.key)}`,
    );
  if (typeof options.task !== "string" || options.task === "")
    throw new TypeError(
      `Agent({ task }) names the task type its model is routed by (${options.key})`,
    );
  const tools = options.tools ?? [];
  for (const type of tools) {
    const kind = typeof type === "function" ? kindOf(type)?.kind : undefined;
    if (kind !== "action" && kind !== "query")
      throw new TypeError(`Agent({ tools }) lists action and query classes (${options.key})`);
  }
  const maxSteps = options.maxSteps ?? DEFAULT_MAX_STEPS;
  if (!Number.isInteger(maxSteps) || maxSteps < 1)
    throw new RangeError(`Agent({ maxSteps }) must be a whole number from 1, got ${maxSteps}`);
  const definition: AgentDefinition = Object.freeze({
    key: options.key,
    task: options.task,
    tools: Object.freeze([...tools]),
    maxSteps,
  });
  AGENT_REGISTRY.set(definition.key, definition);
  return definition;
}

/**
 * The agent kind base.
 *
 * @example
 * export class MatterAssistantAgent extends Agent({
 *   key: "matter_assistant",
 *   task: "chat",
 *   tools: [GetMatterQuery, DraftLetterAction],
 * }) {}
 */
export const Agent = createKind("agent", Promptable, read) as (options: AgentOptions) => AgentClass;
