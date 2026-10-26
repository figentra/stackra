/**
 * Stackra file contract:
 * Purpose: the `ToolDispatcher` port: lists the tools an agent run may offer its model, and dispatches one tool call
 *          as an action call through the one pipeline (ADR 0098), in apply or propose mode.
 * Boundary: an abstract class that is its own token, keyed `ai.ToolDispatcher`. The ai service implements it over the
 *           generated tool table, IAM, the `rule-set:os:ai-action-permissions` matrix (off tools are not listed,
 *           suggest tools run as `propose`) and `ActionPipeline`; this package never decides access. A refusal is an
 *           answer, an approval park is an answer, any other error throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decisions 3 and 4); ADR 0155 (decision 1); R3-SO-02; STA-781.
 */
import type { AnyClass } from "@stackra/container";
import { Port } from "@stackra/contracts";

import type { AgentTool } from "#contracts/types/agent-tool.type";
import type { ToolCallContext } from "#contracts/types/tool-call-context.type";
import type { ToolCallResult } from "#contracts/types/tool-call-result.type";
import type { ToolListing } from "#contracts/types/tool-listing.type";

/**
 * Lists and dispatches agent tools.
 *
 * @example
 * export class PipelineToolDispatcherDriver extends Driver(ToolDispatcher) {
 *   async call(tool: AgentTool, input: unknown, ctx: ToolCallContext): Promise<ToolCallResult> {
 *     const output = await this.pipeline.execute(this.table.classOf(tool.action), input, { actor: ctx.actor, ... });
 *     return { outcome: ToolCallOutcome.Ok, output };
 *   }
 * }
 */
export abstract class ToolDispatcher extends Port {
  /** Type-only port key, so `DriverName<ToolDispatcher>` narrows to this port's drivers. */
  declare readonly "~key": "ai.ToolDispatcher";

  /** The tools of `types` (action and query classes) that `listing`'s principal may use where it acts. */
  abstract tools(types: readonly AnyClass[], listing: ToolListing): Promise<readonly AgentTool[]>;

  /** Dispatches one call of `tool` with `input`. */
  abstract call(tool: AgentTool, input: unknown, ctx: ToolCallContext): Promise<ToolCallResult>;
}
