/**
 * Stackra file contract:
 * Purpose: `Promptable`, the instance side of every agent: `prompt` (one answer), `stream` (the text as it arrives),
 *          `queue` (run it in a worker) and `resume` (continue a run parked on an approval), each over the
 *          `AgentRuntime` the agent was built with and its own definition.
 * Boundary: holds no state but the runtime; the definition is the class's recorded `Agent({...})` options. An agent is
 *           a binding: gen wires the runtime through the constructor.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decision 2: an agent class extends Promptable with prompt, stream, queue and resume);
 *                     STA-781.
 */
import { kindOf } from "@stackra/container";

import type { AgentRuntime } from "#core/services/agent-runtime.service";
import type { AgentDefinition } from "#core/types/agent-definition.type";
import type { AgentReply } from "#core/types/agent-reply.type";
import type { AgentStream } from "#core/types/agent-stream.type";
import type { PromptCall } from "#core/types/prompt-call.type";
import type { QueuedRun } from "#core/types/queued-run.type";
import type { ResumeDecision } from "#core/types/resume-decision.type";

/**
 * Prompts, streams, queues and resumes an agent.
 *
 * @example
 * const reply = await assistant.prompt("Summarise the matter", { actor, record: { kind: "matter", id } });
 * if (reply.pending !== undefined) await notifyApprover(reply.pending);
 */
export abstract class Promptable {
  /** Type-only kind brand, so a class of another kind cannot stand in for an agent. */
  declare readonly "~kind": "agent";

  /** The runtime the agent runs on. */
  protected readonly runtime: AgentRuntime;

  /**
   * @param runtime - the agent runtime over the bound stores, dispatcher, models and instructions.
   */
  constructor(runtime: AgentRuntime) {
    this.runtime = runtime;
  }

  /** Runs `text` to an answer, or to a parked approval. */
  prompt(text: string, call: PromptCall): Promise<AgentReply> {
    return this.runtime.prompt(this.definition(), text, call);
  }

  /** Runs `text`, streaming the model's text. */
  stream(text: string, call: PromptCall): Promise<AgentStream> {
    return this.runtime.stream(this.definition(), text, call);
  }

  /** Stores `text` as a queued run for a worker. */
  queue(text: string, call: PromptCall): Promise<QueuedRun> {
    return this.runtime.queue(this.definition(), text, call);
  }

  /** Continues the run `runId`, parked on the approval `decision` resolves. */
  resume(runId: string, decision: ResumeDecision, abortSignal?: AbortSignal): Promise<AgentReply> {
    return this.runtime.resume(runId, decision, abortSignal);
  }

  /**
   * This agent's definition.
   *
   * @throws TypeError when the class was not declared with `Agent({...})`.
   */
  private definition(): AgentDefinition {
    const options = kindOf(this.constructor as new (...args: never[]) => object)?.options;
    if (options === undefined || typeof options["key"] !== "string")
      throw new TypeError(`${this.constructor.name} is not an agent: extend Agent({...})`);
    return options as unknown as AgentDefinition;
  }
}
