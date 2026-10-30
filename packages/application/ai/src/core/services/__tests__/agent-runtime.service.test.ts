/**
 * Stackra file contract:
 * Purpose: unit tests of `AgentRuntime`: a prompt opens the principal's conversation, stores the prompt and the model's
 *          messages, records steps and tool calls (hashed input, Idempotency-Key `runId:toolCallId`) and completes; a
 *          call the gate parks parks the run without storing its placeholder result, and `resume` re-dispatches it with
 *          the approval id and finishes the loop, or tells the model a denial; `queue` stores a queued run that
 *          `runQueued` runs; `stream` streams text and settles; the session's bypass switch reaches each tool call; a
 *          conversation of another principal is refused; each settled loop meters its tokens on `ai.tokens` with the
 *          model as subject; a blocked prompt opens no run, a redacted prompt and answer are stored redacted, and a
 *          blocked answer fails the run with `guardrail_blocked`; a client tool call parks the run without dispatching,
 *          emits the part to the surface, and `resolveClientTool` resumes it with the answer, a refusal or
 *          `client_result_invalid`, `expireClientTool` with `client_unavailable`, a repeat answer is refused with
 *          `client_tool_not_pending`, and a timer is armed while parked and cleared once answered.
 * Boundary: test only; the model is AI SDK's `MockLanguageModelV4`, the stores are the memory drivers, and the
 *           dispatcher, models, instructions, queue, outbox, discovery and guardrail layers are stand-ins.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0100 (decisions 2, 3, 9 and 10); STA-781; STA-1256; ADR 0156
 *                     (decision 4); ADR 0216 (decision 2); STA-1385; ADR 0490 (decision 4); STA-1631.
 */
import { type DiscoveryService, Driver } from "@stackra/container";
import { type Actor, ActorKind, Clock, Realm } from "@stackra/contracts";
import { ForbiddenError } from "@stackra/errors";
import { EventOutbox } from "@stackra/events/contracts";
import type { RecordedEvent } from "@stackra/events/contracts";
import { describe, expect, it } from "@stackra/testing";
import type { LanguageModel } from "ai";
import { simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { vi } from "vitest";

import { ClientToolKind } from "#contracts/enums/client-tool-kind.enum";
import { SurfaceKind } from "#contracts/enums/surface-kind.enum";
import { RunApprovalStatus } from "#contracts/enums/run-approval-status.enum";
import { RunStatus } from "#contracts/enums/run-status.enum";
import { ToolCallOutcome } from "#contracts/enums/tool-call-outcome.enum";
import { AgentModels } from "#contracts/ports/agent-models.port";
import { AgentQueue } from "#contracts/ports/agent-queue.port";
import { InstructionSource } from "#contracts/ports/instruction-source.port";
import { ToolDispatcher } from "#contracts/ports/tool-dispatcher.port";
import type { AgentTool } from "#contracts/types/agent-tool.type";
import type { ClientToolPart } from "#contracts/types/client-tool-part.type";
import type { ClientToolRow } from "#contracts/types/client-tool-row.type";
import type { SurfaceDescriptor } from "#contracts/types/surface-descriptor.type";
import type { ToolCallContext } from "#contracts/types/tool-call-context.type";
import type { ToolCallResult } from "#contracts/types/tool-call-result.type";
import { AGENT_REGISTRY } from "#core/constants/agent-registry.constant";
import { MemoryConversationStoreDriver } from "#core/drivers/memory-conversation-store.driver";
import { MemoryRunStoreDriver } from "#core/drivers/memory-run-store.driver";
import { ClientToolNotPendingError } from "#core/errors/client-tool-not-pending.error";
import { GuardrailBlockedError } from "#core/errors/guardrail-blocked.error";
import { AiMeter } from "#core/services/ai-meter.service";
import { AgentRuntime } from "#core/services/agent-runtime.service";
import type { AgentDefinition } from "#core/types/agent-definition.type";
import type { Guardrail } from "#core/types/guardrail.type";

const NOW = new Date("2026-10-26T09:00:00.000Z");
const human: Actor = {
  kind: ActorKind.User,
  id: "usr_1",
  realm: Realm.Customer,
  scopeId: "scp_1",
};
const actor: Actor = { kind: ActorKind.Agent, id: "agt_1", scopeId: "scp_1", onBehalfOf: human };
const agent: AgentDefinition = { key: "matter_assistant", task: "chat", tools: [], maxSteps: 4 };
AGENT_REGISTRY.set(agent.key, agent);

const usage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 5, text: 5, reasoning: undefined },
};
const text = (value: string) => ({
  content: [{ type: "text" as const, text: value }],
  finishReason: { unified: "stop" as const, raw: undefined },
  usage,
  warnings: [],
});
const toolCall = (toolCallId: string) => ({
  content: [
    {
      type: "tool-call" as const,
      toolCallId,
      toolName: "legal_letter_send",
      input: JSON.stringify({ to: "client" }),
    },
  ],
  finishReason: { unified: "tool-calls" as const, raw: undefined },
  usage,
  warnings: [],
});

const clientCall = (toolCallId: string) => ({
  content: [
    {
      type: "tool-call" as const,
      toolCallId,
      toolName: "orders_order_list_filter",
      input: JSON.stringify({ status: "open" }),
    },
  ],
  finishReason: { unified: "tool-calls" as const, raw: undefined },
  usage,
  warnings: [],
});
const filterRow: ClientToolRow = {
  key: "orders.order.list.filter",
  name: "orders_order_list_filter",
  from: "client",
  risk: "L0",
  kind: ClientToolKind.Filter,
  target: "orders.order",
  module: "orders",
  inputSchema: { type: "object", properties: { status: { type: "string" } } },
};
const surface: SurfaceDescriptor = {
  id: "srf_1",
  kind: SurfaceKind.Screen,
  app: "console",
  hash: "h1",
  route: "orders",
  locale: "en-US",
};

class FixedClock extends Clock {
  now(): Date {
    return new Date(NOW);
  }
}

/** Offers one tool; parks it until it is called with the granted approval. */
class Dispatcher extends Driver(ToolDispatcher) {
  readonly calls: ToolCallContext[] = [];

  readonly tool: AgentTool = {
    name: "legal_letter_send",
    action: "legal.letter.send@1",
    inputSchema: { type: "object", properties: { to: { type: "string" } } },
    mode: "apply",
  };

  async tools(): Promise<readonly AgentTool[]> {
    return [this.tool];
  }

  async call(_tool: AgentTool, _input: unknown, ctx: ToolCallContext): Promise<ToolCallResult> {
    this.calls.push(ctx);
    return ctx.approvalId === "apr_1"
      ? { outcome: ToolCallOutcome.Ok, output: { sent: true } }
      : { outcome: ToolCallOutcome.ApprovalRequired, approvalId: "apr_1" };
  }
}

/** Records every outbox write. */
class Outbox extends EventOutbox {
  readonly writes: (readonly RecordedEvent[])[] = [];

  override async write(records: readonly RecordedEvent[]): Promise<void> {
    this.writes.push(records);
  }
}

/** A layer that blocks `blocked` and redacts `secret` at either stage. */
const censor: Guardrail = {
  name: "censor",
  check: (value) =>
    value.includes("blocked")
      ? { pass: false, reason: "banned_phrase" }
      : { pass: true, text: value.replaceAll("secret", "[redacted]") },
};

/** A runtime over memory stores, the given model answers and the given guardrail layers. */
function setup(model: Exclude<LanguageModel, string>, layers: readonly Guardrail[] = []) {
  const conversations = new MemoryConversationStoreDriver();
  const runs = new MemoryRunStoreDriver();
  const dispatcher = new Dispatcher();
  const queued: string[] = [];
  const models = new (class extends Driver(AgentModels) {
    async model(): Promise<Exclude<LanguageModel, string>> {
      return model;
    }
  })();
  const instructions = new (class extends Driver(InstructionSource) {
    async instructions(): Promise<string> {
      return "You help with matters.";
    }
  })();
  const queue = new (class extends Driver(AgentQueue) {
    async enqueue(runId: string): Promise<void> {
      queued.push(runId);
    }
  })();
  const outbox = new Outbox();
  const discovery = { getAll: () => [...layers] } as unknown as DiscoveryService;
  const runtime = new AgentRuntime(
    conversations,
    runs,
    dispatcher,
    models,
    instructions,
    queue,
    new FixedClock(),
    new AiMeter(outbox, new FixedClock()),
    discovery,
  );
  return { runtime, conversations, runs, dispatcher, queued, outbox };
}

describe(AgentRuntime, () => {
  it("answers a prompt, storing the conversation and the run's steps", async () => {
    const { runtime, conversations, runs } = setup(
      new MockLanguageModelV4({ doGenerate: text("Done.") }),
    );
    const reply = await runtime.prompt(agent, "Summarise the matter", { actor });
    expect(reply).toMatchObject({ status: RunStatus.Completed, text: "Done." });
    const stored = await conversations.messages(reply.conversationId);
    expect(stored[0]).toEqual({ role: "user", content: "Summarise the matter" });
    expect(stored.at(-1)?.role).toBe("assistant");
    expect(await conversations.get(reply.conversationId)).toMatchObject({ principalId: "usr_1" });
    expect(runs.steps).toEqual([
      { runId: reply.runId, index: 0, finishReason: "stop", inputTokens: 10, outputTokens: 5 },
    ]);
    expect(await runs.get(reply.runId)).toMatchObject({ status: RunStatus.Completed, steps: 1 });
  });

  it("parks on a gated tool call and resumes it with the granted approval", async () => {
    const model = new MockLanguageModelV4({ doGenerate: [toolCall("call_1"), text("Sent it.")] });
    const { runtime, conversations, runs, dispatcher } = setup(model);
    const parked = await runtime.prompt(agent, "Send the letter", { actor });
    expect(parked).toMatchObject({
      status: RunStatus.WaitingApproval,
      pending: { approvalId: "apr_1", toolCallId: "call_1", tool: "legal.letter.send@1" },
    });
    expect(dispatcher.calls[0]).toMatchObject({
      actor,
      runId: parked.runId,
      toolCallId: "call_1",
      idempotencyKey: `${parked.runId}:call_1`,
    });
    const beforeResume = await conversations.messages(parked.conversationId);
    expect(beforeResume.some((message) => message.role === "tool")).toBe(false);
    const [recorded] = await runs.toolCalls(parked.runId);
    expect(recorded).toMatchObject({ outcome: "approval_required", approvalId: "apr_1" });
    expect(recorded?.inputHash).toMatch(/^[0-9a-f]{64}$/);

    const done = await runtime.resume(parked.runId, { approvalId: "apr_1", granted: true });
    expect(done).toMatchObject({ status: RunStatus.Completed, text: "Sent it." });
    expect(dispatcher.calls[1]).toMatchObject({ approvalId: "apr_1", toolCallId: "call_1" });
    expect((await runs.approvals(parked.runId)).map(({ status }) => status)).toEqual([
      RunApprovalStatus.Granted,
    ]);
    const results = (await conversations.messages(parked.conversationId)).filter(
      (message) => message.role === "tool",
    );
    expect(results).toHaveLength(1);
    await expect(
      runtime.resume(parked.runId, { approvalId: "apr_1", granted: true }),
    ).rejects.toThrow(RangeError);
  });

  it("tells the model a denied call was not executed", async () => {
    const model = new MockLanguageModelV4({
      doGenerate: [toolCall("call_2"), text("I could not send it.")],
    });
    const { runtime, conversations, dispatcher } = setup(model);
    const parked = await runtime.prompt(agent, "Send the letter", { actor });
    const done = await runtime.resume(parked.runId, { approvalId: "apr_1", granted: false });
    expect(done.status).toBe(RunStatus.Completed);
    expect(dispatcher.calls).toHaveLength(1);
    const result = (await conversations.messages(parked.conversationId)).find(
      (message) => message.role === "tool",
    );
    expect(JSON.stringify(result)).toContain("approval_denied");
  });

  it("passes the session's bypass switch to every tool call, and none when off", async () => {
    const model = new MockLanguageModelV4({
      doGenerate: [toolCall("call_3"), text("Sent it."), toolCall("call_4"), text("Asked.")],
    });
    const { runtime, dispatcher } = setup(model);
    const parked = await runtime.prompt(agent, "Send the letter", { actor, bypass: true });
    expect(dispatcher.calls[0]).toMatchObject({ toolCallId: "call_3", bypass: true });
    await runtime.resume(parked.runId, { approvalId: "apr_1", granted: true });
    expect(dispatcher.calls[1]).not.toHaveProperty("bypass");
    await runtime.prompt(agent, "Send another", { actor });
    expect(dispatcher.calls[2]).not.toHaveProperty("bypass");
  });

  it("queues a run that a worker then runs", async () => {
    const { runtime, runs, queued } = setup(
      new MockLanguageModelV4({ doGenerate: text("Later.") }),
    );
    const { runId } = await runtime.queue(agent, "Do this later", { actor });
    expect(queued).toEqual([runId]);
    expect((await runs.get(runId))?.status).toBe(RunStatus.Queued);
    expect(await runtime.runQueued(runId)).toMatchObject({
      status: RunStatus.Completed,
      text: "Later.",
    });
    await expect(runtime.runQueued(runId)).rejects.toThrow(RangeError);
  });

  it("streams the text and settles the run", async () => {
    const model = new MockLanguageModelV4({
      doStream: {
        stream: simulateReadableStream({
          chunks: [
            { type: "text-start", id: "t1" },
            { type: "text-delta", id: "t1", delta: "Hel" },
            { type: "text-delta", id: "t1", delta: "lo" },
            { type: "text-end", id: "t1" },
            { type: "finish", finishReason: { unified: "stop", raw: undefined }, usage },
          ],
        }),
      },
    });
    const { runtime } = setup(model);
    const streaming = await runtime.stream(agent, "Hi", { actor });
    let streamed = "";
    for await (const delta of streaming.textStream) streamed += delta;
    expect(streamed).toBe("Hello");
    expect(await streaming.reply).toMatchObject({ status: RunStatus.Completed, text: "Hello" });
  });

  it("meters each settled loop's tokens with the model as subject", async () => {
    const model = new MockLanguageModelV4({ doGenerate: text("Done.") });
    const { runtime, outbox } = setup(model);
    const reply = await runtime.prompt(agent, "Hi", {
      actor,
      scope: { id: "scp_1", path: "scp_1" },
    });
    expect(outbox.writes).toHaveLength(1);
    const [input, output] = outbox.writes[0] ?? [];
    expect(input?.event).toMatchObject({
      meter: "ai.tokens",
      key: "ai.tokens.input",
      value: 10,
      subject: `${model.provider}/${model.modelId}`,
      callId: reply.runId,
      scopeId: "scp_1",
    });
    expect(output?.event).toMatchObject({ key: "ai.tokens.output", value: 5 });
    expect(input?.meta).toMatchObject({ actor, correlationId: reply.runId });
  });

  it("refuses a blocked prompt before opening a conversation or a run", async () => {
    const { runtime, runs } = setup(new MockLanguageModelV4({ doGenerate: text("ok") }), [censor]);
    await expect(runtime.prompt(agent, "a blocked request", { actor })).rejects.toBeInstanceOf(
      GuardrailBlockedError,
    );
    expect(runs.steps).toEqual([]);
  });

  it("stores the redacted prompt and answer", async () => {
    const { runtime, conversations } = setup(
      new MockLanguageModelV4({ doGenerate: text("The secret is out.") }),
      [censor],
    );
    const reply = await runtime.prompt(agent, "Tell the secret", { actor });
    expect(reply.text).toBe("The [redacted] is out.");
    const stored = await conversations.messages(reply.conversationId);
    expect(stored[0]).toEqual({ role: "user", content: "Tell the [redacted]" });
    expect(JSON.stringify(stored.at(-1))).toContain("The [redacted] is out.");
    expect(JSON.stringify(stored)).not.toContain("secret");
  });

  it("fails the run when a layer blocks the answer", async () => {
    const { runtime, runs, outbox } = setup(
      new MockLanguageModelV4({ doGenerate: text("This is blocked.") }),
      [censor],
    );
    const refused = await runtime.prompt(agent, "Hi", { actor }).catch((error: unknown) => error);
    expect(refused).toBeInstanceOf(GuardrailBlockedError);
    expect(refused).toMatchObject({
      guardrail: "censor",
      stage: "output",
      reason: "banned_phrase",
    });
    expect(runs.steps).toEqual([]);
    // The tokens were spent, so they are metered before the block.
    expect(outbox.writes).toHaveLength(1);
  });

  it("parks on a client tool call, emits it to the surface and resumes with the answer", async () => {
    const parts: ClientToolPart[] = [];
    const model = new MockLanguageModelV4({
      doGenerate: [clientCall("call_c1"), text("Filtered.")],
    });
    const { runtime, conversations, runs, dispatcher } = setup(model);
    const parked = await runtime.prompt(agent, "Show open orders", {
      actor,
      surface,
      clientTools: [filterRow],
      onClientTool: (part) => parts.push(part),
    });
    expect(parked).toMatchObject({
      status: RunStatus.WaitingClientTool,
      clientPending: { toolCallId: "call_c1", surfaceId: "srf_1", tool: filterRow.key },
    });
    expect(parts).toEqual([
      {
        type: "client_tool",
        runId: parked.runId,
        toolCallId: "call_c1",
        surfaceId: "srf_1",
        tool: filterRow.key,
        input: { status: "open" },
        expiresAt: new Date(NOW.getTime() + 30_000).toISOString(),
      },
    ]);
    // A client tool never reaches the dispatcher and its placeholder result is not stored.
    expect(dispatcher.calls).toHaveLength(0);
    expect(
      (await conversations.messages(parked.conversationId)).some(
        (message) => message.role === "tool",
      ),
    ).toBe(false);
    expect((await runs.get(parked.runId))?.clientPending?.toolCallId).toBe("call_c1");

    const done = await runtime.resolveClientTool(parked.runId, {
      toolCallId: "call_c1",
      result: { done: true },
    });
    expect(done).toMatchObject({ status: RunStatus.Completed, text: "Filtered." });
    expect((await runs.toolCalls(parked.runId)).map(({ outcome }) => outcome)).toEqual([
      ToolCallOutcome.ClientTool,
      ToolCallOutcome.Ok,
    ]);
    expect((await runs.get(parked.runId))?.clientPending).toBeUndefined();
    const results = (await conversations.messages(parked.conversationId)).filter(
      (message) => message.role === "tool",
    );
    expect(results).toHaveLength(1);
    expect(JSON.stringify(results[0])).toContain('"done":true');
  });

  it("refuses an answer for an unknown or already answered tool call", async () => {
    const model = new MockLanguageModelV4({ doGenerate: [clientCall("call_c2"), text("Ok.")] });
    const { runtime } = setup(model);
    const parked = await runtime.prompt(agent, "Show open orders", {
      actor,
      surface,
      clientTools: [filterRow],
    });
    await expect(
      runtime.resolveClientTool(parked.runId, { toolCallId: "call_other", result: { done: true } }),
    ).rejects.toBeInstanceOf(ClientToolNotPendingError);
    await runtime.resolveClientTool(parked.runId, {
      toolCallId: "call_c2",
      result: { done: true },
    });
    await expect(
      runtime.resolveClientTool(parked.runId, { toolCallId: "call_c2", result: { done: true } }),
    ).rejects.toBeInstanceOf(ClientToolNotPendingError);
  });

  it("tells the model a refusal or an invalid result, never the raw answer", async () => {
    for (const [answer, code] of [
      [{ toolCallId: "call_c3", refusal: "handler_missing" }, "handler_missing"],
      [{ toolCallId: "call_c3", result: { done: "yes" } }, "client_result_invalid"],
    ] as const) {
      const model = new MockLanguageModelV4({ doGenerate: [clientCall("call_c3"), text("Ok.")] });
      const { runtime, conversations, runs } = setup(model);
      const parked = await runtime.prompt(agent, "Show open orders", {
        actor,
        surface,
        clientTools: [filterRow],
      });
      await runtime.resolveClientTool(parked.runId, answer as never);
      const result = (await conversations.messages(parked.conversationId)).find(
        (message) => message.role === "tool",
      );
      expect(JSON.stringify(result)).toContain(code);
      expect((await runs.toolCalls(parked.runId)).at(-1)).toMatchObject({
        outcome: ToolCallOutcome.Refused,
        code,
      });
    }
  });

  it("resumes with client_unavailable when the wait ends", async () => {
    const model = new MockLanguageModelV4({ doGenerate: [clientCall("call_c4"), text("Sorry.")] });
    const { runtime, conversations } = setup(model);
    const parked = await runtime.prompt(agent, "Show open orders", {
      actor,
      surface,
      clientTools: [filterRow],
    });
    const done = await runtime.expireClientTool(parked.runId, "call_c4");
    expect(done).toMatchObject({ status: RunStatus.Completed, text: "Sorry." });
    const result = (await conversations.messages(parked.conversationId)).find(
      (message) => message.role === "tool",
    );
    expect(JSON.stringify(result)).toContain("client_unavailable");
    await expect(runtime.expireClientTool(parked.runId, "call_c4")).rejects.toBeInstanceOf(
      ClientToolNotPendingError,
    );
  });

  it("arms a timer while parked and clears it once answered", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    try {
      const model = new MockLanguageModelV4({ doGenerate: [clientCall("call_c5"), text("Ok.")] });
      const { runtime } = setup(model);
      const parked = await runtime.prompt(agent, "Show open orders", {
        actor,
        surface,
        clientTools: [filterRow],
        clientToolTimeoutMs: 5000,
      });
      expect(vi.getTimerCount()).toBe(1);
      await runtime.resolveClientTool(parked.runId, {
        toolCallId: "call_c5",
        result: { done: true },
      });
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("refuses another principal's conversation", async () => {
    const { runtime } = setup(new MockLanguageModelV4({ doGenerate: text("ok") }));
    const first = await runtime.prompt(agent, "Hi", { actor });
    const other: Actor = {
      kind: ActorKind.Agent,
      id: "agt_1",
      onBehalfOf: { kind: ActorKind.User, id: "usr_2", realm: Realm.Customer },
    };
    await expect(
      runtime.prompt(agent, "Hi", { actor: other, conversationId: first.conversationId }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
