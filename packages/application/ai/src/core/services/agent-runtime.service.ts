/**
 * Stackra file contract:
 * Purpose: `AgentRuntime`, the agent loop on AI SDK core behind `Promptable`: opens or continues the principal's
 *          conversation, stores the prompt, starts a run, offers the model the tools the dispatcher lists, dispatches
 *          every tool call as an action call (Idempotency-Key `runId:toolCallId`), records each step, tool call and
 *          approval, parks the run on the first call the approval gate parks, stores the model's messages, and resumes
 *          a parked run once the approval resolves; `queue` stores a run for a worker, which runs it with `runQueued`.
 *          Every tool call carries the session's bypass switch (`PromptCall.bypass`, `ResumeDecision.bypass`); a
 *          queued run has no session, so its calls carry none. Every bound `GuardrailLayer` checks the prompt before
 *          it is stored and the answer before it is stored (`runGuardrails`; a redaction is what gets stored, a block
 *          fails the run with `GuardrailBlockedError`), and `AiMeter` meters each settled loop's token usage.
 * Boundary: a service over the ai ports (`ConversationStore`, `RunStore`, `ToolDispatcher`, `AgentModels`,
 *           `InstructionSource`, `AgentQueue`), the `Clock`, `AiMeter` and the bound `GuardrailLayer`s (through
 *           `DiscoveryService`, in wiring order); it names no provider, prompt or policy. Text lives only
 *           in the conversation; runs, steps and tool calls hold hashes, codes and counts (ADR 0100 decision 9). A run
 *           acts only as its stored principal, scope and record, never as anything the model says. The tool result of a
 *           parked call is not stored, so the conversation holds exactly one result per call once it resumes.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decisions 2, 3, 5, 9 and 10); ADR 0155 (no hosted gateway); ADR 0227 (no separate
 *                     agent runtime); STA-781; STA-1256 (bypass switch); ADR 0156 (decision 4), ADR 0216 (decision 2),
 *                     STA-1385 (guardrails and meter wired).
 */
import { type DiscoveryService, Service } from "@stackra/container";
import type { Actor, Clock } from "@stackra/contracts";
import { ForbiddenError, NotFoundError } from "@stackra/errors";
import {
  generateText,
  jsonSchema,
  type LanguageModel,
  type ModelMessage,
  stepCountIs,
  streamText,
  tool,
  type ToolSet,
} from "ai";

import { RunApprovalStatus } from "#contracts/enums/run-approval-status.enum";
import { RunStatus } from "#contracts/enums/run-status.enum";
import { ToolCallOutcome } from "#contracts/enums/tool-call-outcome.enum";
import type { AgentModels } from "#contracts/ports/agent-models.port";
import type { AgentQueue } from "#contracts/ports/agent-queue.port";
import type { ConversationStore } from "#contracts/ports/conversation-store.port";
import type { InstructionSource } from "#contracts/ports/instruction-source.port";
import type { RunStore } from "#contracts/ports/run-store.port";
import type { ToolDispatcher } from "#contracts/ports/tool-dispatcher.port";
import type { AgentTool } from "#contracts/types/agent-tool.type";
import type { RunRecord } from "#contracts/types/run-record.type";
import { AGENT_REGISTRY } from "#core/constants/agent-registry.constant";
import { GuardrailBlockedError } from "#core/errors/guardrail-blocked.error";
import { runGuardrails } from "#core/functions/run-guardrails.function";
import { GuardrailLayer } from "#core/ports/guardrail-layer.port";
import type { AiMeter } from "#core/services/ai-meter.service";
import type { AgentDefinition } from "#core/types/agent-definition.type";
import type { AgentReply } from "#core/types/agent-reply.type";
import type { AgentStream } from "#core/types/agent-stream.type";
import type { PendingApproval } from "#core/types/pending-approval.type";
import type { PromptCall } from "#core/types/prompt-call.type";
import type { QueuedRun } from "#core/types/queued-run.type";
import type { ResumeDecision } from "#core/types/resume-decision.type";

/** What one model loop accumulates. */
interface LoopState {
  /** The first tool call the gate parked in this loop. */
  paused: PendingApproval | undefined;

  /** The session's bypass switch, passed to every tool call. */
  readonly bypass: boolean;

  /** `<provider>/<model>` of the routed model, once `setup` chose it; the meter's subject. */
  model?: string;
}

/** The parts of a settled model call the runtime stores. */
interface Settled {
  readonly messages: readonly ModelMessage[];
  readonly steps: readonly {
    readonly finishReason: string;
    // The AI SDK reports a token count it lacks as `undefined`, not as a missing key.
    readonly usage: {
      readonly inputTokens: number | undefined;
      readonly outputTokens: number | undefined;
    };
  }[];
  readonly text: string;
}

/** The human a principal acts for: the end of its on-behalf-of chain. */
function humanOf(actor: Actor): Actor {
  let link = actor;
  while (link.onBehalfOf !== undefined) link = link.onBehalfOf;
  return link;
}

/** JSON with object keys sorted, so equal inputs hash equally. */
function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, inner: unknown) =>
    inner !== null && typeof inner === "object" && !Array.isArray(inner)
      ? Object.fromEntries(Object.entries(inner).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
      : inner,
  );
}

/** The SHA-256 of `value`'s canonical JSON, hex. */
async function hashOf(value: unknown): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonical(value) ?? "null"),
  );
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** `<provider>/<model>` of a routed model. */
function modelLabel(model: Exclude<LanguageModel, string>): string {
  return `${model.provider}/${model.modelId}`;
}

/**
 * `messages` with the text of the last assistant message replaced by `text` (a guardrail's redaction).
 * shortcut: only the final answer is redacted; text the model wrote beside earlier tool calls is stored as written.
 * Redact those too when a layer needs it.
 */
function withAnswer(messages: readonly ModelMessage[], text: string): ModelMessage[] {
  let last = -1;
  for (const [index, message] of messages.entries()) if (message.role === "assistant") last = index;
  return messages.map((message, index) => {
    if (index !== last || message.role !== "assistant") return message;
    if (typeof message.content === "string") return { ...message, content: text };
    const first = message.content.findIndex((part) => part.type === "text");
    const content = message.content.flatMap((part, at) =>
      part.type !== "text" ? [part] : at === first ? [{ ...part, text }] : [],
    );
    return { ...message, content };
  });
}

/** `messages` without the tool result of `toolCallId`, dropping a tool message left empty. */
function withoutResult(messages: readonly ModelMessage[], toolCallId: string): ModelMessage[] {
  const kept: ModelMessage[] = [];
  for (const message of messages) {
    if (message.role !== "tool") {
      kept.push(message);
      continue;
    }
    const content = message.content.filter(
      (part) => !(part.type === "tool-result" && part.toolCallId === toolCallId),
    );
    if (content.length > 0) kept.push({ ...message, content });
  }
  return kept;
}

/**
 * Runs agents: prompts, streams and queued runs, with their tools, approvals and records.
 *
 * @example
 * const runtime = new AgentRuntime(conversations, runs, dispatcher, models, instructions, queue, clock, meter, discovery);
 * const reply = await runtime.prompt(definition, "Summarise the matter", { actor });
 */
export class AgentRuntime extends Service {
  private readonly conversations: ConversationStore;

  private readonly runs: RunStore;

  private readonly dispatcher: ToolDispatcher;

  private readonly models: AgentModels;

  private readonly instructions: InstructionSource;

  private readonly agentQueue: AgentQueue;

  private readonly clock: Clock;

  private readonly meter: AiMeter;

  private readonly discovery: DiscoveryService;

  /**
   * @param conversations - where conversations and their (sealed) messages live.
   * @param runs - where runs, steps, tool calls and approvals live.
   * @param dispatcher - lists tools and dispatches tool calls through the action pipeline.
   * @param models - routes a run to its model.
   * @param instructions - the agents' published instructions.
   * @param agentQueue - hands queued runs to a worker.
   * @param clock - the current time.
   * @param meter - meters each settled loop's tokens (`ai.tokens`).
   * @param discovery - lists the bound `GuardrailLayer`s that check every prompt and answer.
   */
  constructor(
    conversations: ConversationStore,
    runs: RunStore,
    dispatcher: ToolDispatcher,
    models: AgentModels,
    instructions: InstructionSource,
    agentQueue: AgentQueue,
    clock: Clock,
    meter: AiMeter,
    discovery: DiscoveryService,
  ) {
    super();
    this.conversations = conversations;
    this.runs = runs;
    this.dispatcher = dispatcher;
    this.models = models;
    this.instructions = instructions;
    this.agentQueue = agentQueue;
    this.clock = clock;
    this.meter = meter;
    this.discovery = discovery;
  }

  /**
   * Runs `text` for `agent` to an answer, or to the first parked approval.
   *
   * @throws NotFoundError when `call.conversationId` names no visible conversation.
   * @throws ForbiddenError when it belongs to another principal or agent.
   */
  async prompt(agent: AgentDefinition, text: string, call: PromptCall): Promise<AgentReply> {
    const run = await this.begin(agent, text, call, RunStatus.Running);
    return this.loop(agent, run, call.locale, call.abortSignal, call.bypass === true);
  }

  /** Runs `text` for `agent`, streaming the model's text; `reply` settles as `prompt` does. */
  async stream(agent: AgentDefinition, text: string, call: PromptCall): Promise<AgentStream> {
    const run = await this.begin(agent, text, call, RunStatus.Running);
    const state: LoopState = { paused: undefined, bypass: call.bypass === true };
    const result = streamText({
      ...(await this.setup(agent, run, state, call.locale)),
      ...(call.abortSignal === undefined ? {} : { abortSignal: call.abortSignal }),
    });
    const reply = (async () => {
      try {
        const [response, steps, finalText] = await Promise.all([
          result.response,
          result.steps,
          result.text,
        ]);
        return await this.settle(
          run,
          { messages: response.messages, steps, text: finalText },
          state,
        );
      } catch (error) {
        await this.fail(run, error);
        throw error;
      }
    })();
    return {
      runId: run.id,
      conversationId: run.conversationId,
      textStream: result.textStream,
      reply,
    };
  }

  /** Stores `text` as a queued run of `agent` and hands it to the queue. */
  async queue(agent: AgentDefinition, text: string, call: PromptCall): Promise<QueuedRun> {
    const run = await this.begin(agent, text, call, RunStatus.Queued);
    await this.agentQueue.enqueue(run.id, agent.key);
    return { runId: run.id, conversationId: run.conversationId };
  }

  /**
   * Runs the queued run `runId` (in the worker the queue delivered it to).
   *
   * @throws NotFoundError when the run is not visible; RangeError when it is not queued or its agent is not declared.
   */
  async runQueued(runId: string, locale?: string, abortSignal?: AbortSignal): Promise<AgentReply> {
    const run = await this.stored(runId);
    if (run.status !== RunStatus.Queued)
      throw new RangeError(`Run ${runId} is ${run.status}, not queued`);
    await this.runs.update(run.id, { status: RunStatus.Running });
    return this.loop(this.agentOf(run), { ...run, status: RunStatus.Running }, locale, abortSignal);
  }

  /**
   * Continues the run `runId` parked on `decision.approvalId`: a grant dispatches the parked call again with the
   * approval id (the gate re-checks it), a denial tells the model the call was not executed; then the loop goes on.
   *
   * @throws NotFoundError when the run is not visible; RangeError when it is not parked on that approval.
   */
  async resume(
    runId: string,
    decision: ResumeDecision,
    abortSignal?: AbortSignal,
    locale?: string,
  ): Promise<AgentReply> {
    const run = await this.stored(runId);
    const { pending } = run;
    if (run.status !== RunStatus.WaitingApproval || pending?.approvalId !== decision.approvalId)
      throw new RangeError(`Run ${runId} is not parked on approval ${decision.approvalId}`);
    const agent = this.agentOf(run);
    const parked = (await this.runs.approvals(run.id)).find(
      (approval) => approval.approvalId === pending.approvalId,
    );
    await this.runs.recordApproval({
      approvalId: pending.approvalId,
      runId: run.id,
      toolCallId: pending.toolCallId,
      tool: parked?.tool ?? "",
      status: decision.granted ? RunApprovalStatus.Granted : RunApprovalStatus.Denied,
      at: this.clock.now(),
    });
    const history = await this.conversations.messages(run.conversationId);
    const callPart = history
      .flatMap((message) =>
        message.role === "assistant" && Array.isArray(message.content) ? message.content : [],
      )
      .find((part) => part.type === "tool-call" && part.toolCallId === pending.toolCallId);
    if (callPart === undefined || callPart.type !== "tool-call")
      throw new RangeError(`Run ${runId} has no stored tool call ${pending.toolCallId}`);
    const offered = decision.granted
      ? (await this.dispatcher.tools(agent.tools, this.listingOf(run))).find(
          (candidate) => candidate.name === callPart.toolName,
        )
      : undefined;
    const bypass = decision.bypass === true;
    const state: LoopState = { paused: undefined, bypass };
    const output =
      offered === undefined
        ? {
            type: "execution-denied" as const,
            reason: decision.granted ? "tool_not_offered" : "approval_denied",
          }
        : {
            type: "json" as const,
            value: (await this.called(
              run,
              offered,
              callPart.input,
              pending.toolCallId,
              state,
              decision.approvalId,
            )) as never,
          };
    await this.conversations.append(run.conversationId, run.id, [
      {
        role: "tool",
        content: [
          {
            type: "tool-result",
            toolCallId: pending.toolCallId,
            toolName: callPart.toolName,
            output,
          },
        ],
      },
    ]);
    if (state.paused !== undefined) {
      await this.runs.update(run.id, {
        status: RunStatus.WaitingApproval,
        pending: { approvalId: state.paused.approvalId, toolCallId: state.paused.toolCallId },
      });
      return {
        runId: run.id,
        conversationId: run.conversationId,
        status: RunStatus.WaitingApproval,
        text: "",
        pending: state.paused,
      };
    }
    await this.runs.update(run.id, { status: RunStatus.Running, pending: null });
    return this.loop(agent, { ...run, status: RunStatus.Running }, locale, abortSignal, bypass);
  }

  /** Opens or continues the conversation, starts the run in `status` and stores the prompt. */
  private async begin(
    agent: AgentDefinition,
    text: string,
    call: PromptCall,
    status: RunStatus,
  ): Promise<RunRecord> {
    // Before anything is stored: a blocked prompt opens no conversation and no run.
    const prompt = await this.guarded(text, "input");
    const human = humanOf(call.actor);
    let conversationId = call.conversationId;
    if (conversationId === undefined) {
      const opened = await this.conversations.open({
        agent: agent.key,
        principalId: human.id,
        ...(call.scope === undefined ? {} : { scopeId: call.scope.id }),
        ...(call.record === undefined ? {} : { record: call.record }),
      });
      conversationId = opened.id;
    } else {
      const found = await this.conversations.get(conversationId);
      if (found === undefined) throw NotFoundError.create();
      if (found.principalId !== human.id || found.agent !== agent.key)
        throw ForbiddenError.create();
    }
    const run = await this.runs.create({
      conversationId,
      agent: agent.key,
      actor: call.actor,
      ...(call.scope === undefined ? {} : { scope: call.scope }),
      ...(call.record === undefined ? {} : { record: call.record }),
      status,
    });
    await this.conversations.append(conversationId, run.id, [{ role: "user", content: prompt }]);
    return run;
  }

  /** The settings of one model call: the routed model, the instructions, the stored messages and the tools. */
  private async setup(agent: AgentDefinition, run: RunRecord, state: LoopState, locale?: string) {
    const [model, instructions, messages, offered] = await Promise.all([
      this.models.model(agent.task, run.actor),
      this.instructions.instructions(agent.key, locale),
      this.conversations.messages(run.conversationId),
      this.dispatcher.tools(agent.tools, this.listingOf(run)),
    ]);
    const tools: ToolSet = Object.fromEntries(
      offered.map((each) => [
        each.name,
        tool({
          ...(each.description === undefined ? {} : { description: each.description }),
          inputSchema: jsonSchema(each.inputSchema as never),
          execute: (input: unknown, { toolCallId }: { toolCallId: string }) =>
            this.called(run, each, input, toolCallId, state),
        }),
      ]),
    );
    state.model = modelLabel(model);
    return {
      model,
      instructions,
      messages: [...messages],
      tools,
      stopWhen: [stepCountIs(agent.maxSteps), () => state.paused !== undefined],
    };
  }

  /** Runs the model loop of `run` to its end and settles it. */
  private async loop(
    agent: AgentDefinition,
    run: RunRecord,
    locale: string | undefined,
    abortSignal: AbortSignal | undefined,
    bypass = false,
  ): Promise<AgentReply> {
    const state: LoopState = { paused: undefined, bypass };
    try {
      const result = await generateText({
        ...(await this.setup(agent, run, state, locale)),
        ...(abortSignal === undefined ? {} : { abortSignal }),
      });
      return await this.settle(
        run,
        { messages: result.response.messages, steps: result.steps, text: result.text },
        state,
      );
    } catch (error) {
      await this.fail(run, error);
      throw error;
    }
  }

  /**
   * Dispatches one tool call and records it; answers what the model sees: the output, a refusal, a draft, or that
   * the call waits for an approval (and the loop stops after this step).
   */
  private async called(
    run: RunRecord,
    offered: AgentTool,
    input: unknown,
    toolCallId: string,
    state: LoopState,
    approvalId?: string,
  ): Promise<unknown> {
    const result = await this.dispatcher.call(offered, input, {
      actor: run.actor,
      ...(run.scope === undefined ? {} : { scope: run.scope }),
      ...(run.record === undefined ? {} : { record: run.record }),
      runId: run.id,
      toolCallId,
      idempotencyKey: `${run.id}:${toolCallId}`,
      ...(approvalId === undefined ? {} : { approvalId }),
      ...(state.bypass ? { bypass: true } : {}),
    });
    const at = this.clock.now();
    await this.runs.recordToolCall({
      runId: run.id,
      toolCallId,
      tool: offered.action,
      inputHash: await hashOf(input),
      outcome: result.outcome,
      ...(result.outcome === ToolCallOutcome.Refused ? { code: result.code } : {}),
      ...(result.outcome === ToolCallOutcome.ApprovalRequired
        ? { approvalId: result.approvalId }
        : {}),
      at,
    });
    switch (result.outcome) {
      case ToolCallOutcome.Ok:
        return result.output;
      case ToolCallOutcome.Refused:
        return { refused: result.code };
      case ToolCallOutcome.Proposed:
        return { proposed: result.draft };
      case ToolCallOutcome.ApprovalRequired: {
        await this.runs.recordApproval({
          approvalId: result.approvalId,
          runId: run.id,
          toolCallId,
          tool: offered.action,
          status: RunApprovalStatus.Pending,
          at,
        });
        // shortcut: a run parks on its first parked call; a second one in the same step stays pending in the run's
        // approvals and the model is told it waits. Resume one at a time when products ask for batch approvals.
        state.paused ??= { approvalId: result.approvalId, toolCallId, tool: offered.action };
        return { waiting: "approval_required" };
      }
    }
  }

  /** Stores the model's messages and steps, and parks or completes the run. */
  private async settle(run: RunRecord, settled: Settled, state: LoopState): Promise<AgentReply> {
    const stored = await this.stored(run.id);
    // The tokens were spent whatever the guardrails say, so meter first.
    await this.meter.tokens(
      {
        inputTokens: settled.steps.reduce((sum, step) => sum + (step.usage.inputTokens ?? 0), 0),
        outputTokens: settled.steps.reduce((sum, step) => sum + (step.usage.outputTokens ?? 0), 0),
      },
      {
        reference: run.id,
        model: state.model ?? "unknown",
        ...(run.scope === undefined ? {} : { scopeId: run.scope.id }),
        actor: run.actor,
      },
    );
    const answer = settled.text === "" ? "" : await this.guarded(settled.text, "output");
    const kept =
      state.paused === undefined
        ? settled.messages
        : withoutResult(settled.messages, state.paused.toolCallId);
    const messages = answer === settled.text ? kept : withAnswer(kept, answer);
    await this.conversations.append(run.conversationId, run.id, messages);
    for (const [offset, step] of settled.steps.entries())
      await this.runs.recordStep({
        runId: run.id,
        index: stored.steps + offset,
        finishReason: step.finishReason,
        inputTokens: step.usage.inputTokens ?? 0,
        outputTokens: step.usage.outputTokens ?? 0,
      });
    const steps = stored.steps + settled.steps.length;
    const base = { runId: run.id, conversationId: run.conversationId, text: answer };
    if (state.paused !== undefined) {
      await this.runs.update(run.id, {
        status: RunStatus.WaitingApproval,
        pending: { approvalId: state.paused.approvalId, toolCallId: state.paused.toolCallId },
        steps,
      });
      return { ...base, status: RunStatus.WaitingApproval, pending: state.paused };
    }
    await this.runs.update(run.id, {
      status: RunStatus.Completed,
      pending: null,
      steps,
      finishedAt: this.clock.now(),
    });
    return { ...base, status: RunStatus.Completed };
  }

  /**
   * `text` after every bound guardrail layer at `stage`: the text to store and send on.
   *
   * @throws GuardrailBlockedError when a layer blocks it.
   */
  private async guarded(text: string, stage: "input" | "output"): Promise<string> {
    const result = await runGuardrails(this.discovery.getAll(GuardrailLayer), text, stage);
    if (!result.pass)
      throw GuardrailBlockedError.create({
        guardrail: result.guardrail,
        stage,
        reason: result.reason,
      });
    return result.text;
  }

  /** Marks `run` failed with the error's code (a refusal's), or `error`. */
  private async fail(run: RunRecord, error: unknown): Promise<void> {
    const code =
      typeof error === "object" &&
      error !== null &&
      typeof (error as { code?: unknown }).code === "string"
        ? (error as { code: string }).code
        : "error";
    await this.runs.update(run.id, {
      status: RunStatus.Failed,
      errorCode: code,
      finishedAt: this.clock.now(),
    });
  }

  /**
   * The stored run `runId`.
   *
   * @throws NotFoundError when it is not visible.
   */
  private async stored(runId: string): Promise<RunRecord> {
    const run = await this.runs.get(runId);
    if (run === undefined) throw NotFoundError.create();
    return run;
  }

  /**
   * The declared agent of `run`.
   *
   * @throws RangeError when no agent with its key is declared in this process.
   */
  private agentOf(run: RunRecord): AgentDefinition {
    const agent = AGENT_REGISTRY.get(run.agent);
    if (agent === undefined)
      throw new RangeError(
        `No agent "${run.agent}" is declared here: import its class in the worker`,
      );
    return agent;
  }

  /** The tool listing of `run`: its stored principal, scope and record. */
  private listingOf(run: RunRecord) {
    return {
      actor: run.actor,
      ...(run.scope === undefined ? {} : { scope: run.scope }),
      ...(run.record === undefined ? {} : { record: run.record }),
    };
  }
}
