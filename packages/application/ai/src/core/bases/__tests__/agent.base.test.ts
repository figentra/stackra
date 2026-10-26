/**
 * Stackra file contract:
 * Purpose: unit tests of `Agent` and `Promptable`: the called form records the `agent` kind with its defaults and
 *          keeps the definition by key; it refuses a malformed key, a missing task, a tool that is not an action or a
 *          query, and a bad step limit; an agent's `prompt`, `stream`, `queue` and `resume` hand its definition to the
 *          runtime; a class that is not an agent is refused.
 * Boundary: test only; the runtime is a recording stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0100 (decision 2); STA-781.
 */
import { Query, type QueryContext } from "@stackra/actions";
import { kindOf } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Agent } from "#core/bases/agent.base";
import { Promptable } from "#core/bases/promptable.base";
import { AGENT_REGISTRY } from "#core/constants/agent-registry.constant";
import type { AgentRuntime } from "#core/services/agent-runtime.service";

class GetMatterQuery extends Query({
  key: "matter.get",
  actors: [ActorKind.User, ActorKind.Agent],
}) {
  async handle(input: { matterId: string }, _ctx: QueryContext): Promise<{ id: string }> {
    return { id: input.matterId };
  }
}

class MatterAssistantAgent extends Agent({
  key: "matter_assistant",
  task: "chat",
  tools: [GetMatterQuery],
}) {}

/** A runtime that answers with what it was handed. */
const runtime = {
  prompt: async (agent: unknown, text: string) => ({ agent, text }),
  stream: async (agent: unknown, text: string) => ({ agent, text }),
  queue: async (agent: unknown, text: string) => ({ agent, text }),
  resume: async (runId: string, decision: unknown) => ({ runId, decision }),
} as unknown as AgentRuntime;

const actor = { kind: ActorKind.Agent, id: "agt_1" } as const;

describe("Agent", () => {
  it("records the agent with its defaults and keeps it by key", () => {
    const definition = {
      key: "matter_assistant",
      task: "chat",
      tools: [GetMatterQuery],
      maxSteps: 8,
    };
    expect(kindOf(MatterAssistantAgent)).toEqual({ kind: "agent", options: definition });
    expect(AGENT_REGISTRY.get("matter_assistant")).toEqual(definition);
  });

  it("refuses malformed options", () => {
    expect(() => Agent({ key: "Matter-Assistant", task: "chat" })).toThrow(TypeError);
    expect(() => Agent({ key: "assistant", task: "" })).toThrow(TypeError);
    class NotATool {}
    expect(() => Agent({ key: "assistant", task: "chat", tools: [NotATool] })).toThrow(TypeError);
    expect(() => Agent({ key: "assistant", task: "chat", maxSteps: 0 })).toThrow(RangeError);
  });

  it("hands its definition to the runtime", async () => {
    const assistant = new MatterAssistantAgent(runtime);
    expect(assistant).toBeInstanceOf(Promptable);
    const definition = AGENT_REGISTRY.get("matter_assistant");
    await expect(assistant.prompt("Hi", { actor })).resolves.toEqual({
      agent: definition,
      text: "Hi",
    });
    await expect(assistant.stream("Hi", { actor })).resolves.toEqual({
      agent: definition,
      text: "Hi",
    });
    await expect(assistant.queue("Hi", { actor })).resolves.toEqual({
      agent: definition,
      text: "Hi",
    });
    await expect(
      assistant.resume("airun_1", { approvalId: "apr_1", granted: true }),
    ).resolves.toEqual({ runId: "airun_1", decision: { approvalId: "apr_1", granted: true } });
  });

  it("refuses a Promptable that was not declared with Agent", async () => {
    class Loose extends Promptable {}
    await expect(async () => new Loose(runtime).prompt("Hi", { actor })).rejects.toThrow(TypeError);
  });
});
