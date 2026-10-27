/**
 * Stackra file contract:
 * Purpose: `PostgresRunStoreDriver`, the `RunStore` over `ai.runs`, `ai.steps`, `ai.tool_calls` and `ai.approvals`:
 *          creates and updates runs, records steps, tool calls and approvals, and reads them per run.
 * Boundary: a driver over the four repositories, so every read and write runs in the caller's tenant session under
 *           row-level security. Inserts are written at once; a run's or an approval's update changes the loaded row,
 *           which the caller's unit of work flushes. No text is written here (ADR 0100 decision 9). The three ADR 0100
 *           decision 11 events are recorded on the row that changes, so the outbox writes them in the flush that
 *           writes the change: `ApprovalRequested` on the run as it parks, `ApprovalResolved` on the approval as it
 *           leaves `pending`, `RunCompleted` on the run as it completes or fails. The table names stay `ai_*` until the
 *           owner confirms the `ai.<name>` schema (ADR 0399).
 * Runtime: node
 * Governing contract: ADR 0100 (decisions 2, 3, 9, 10 and 11); ADR 0399; ADR 0078 (decision 3); STA-781.
 */
import { Driver } from "@stackra/container";
import type { Actor, PublicId, ScopeRef } from "@stackra/contracts";
import type { Repository } from "@stackra/database";
import { recordEvent } from "@stackra/events";

import { RunApprovalStatus } from "#contracts/enums/run-approval-status.enum";
import { RunStatus } from "#contracts/enums/run-status.enum";
import { RunStore } from "#contracts/ports/run-store.port";
import type { RecordScope } from "#contracts/types/record-scope.type";
import type { RunApprovalRecord } from "#contracts/types/run-approval-record.type";
import type { RunRecord } from "#contracts/types/run-record.type";
import type { RunStepRecord } from "#contracts/types/run-step-record.type";
import type { ToolCallRecord } from "#contracts/types/tool-call-record.type";
import { ApprovalRequested } from "#core/events/approval-requested.event";
import { ApprovalResolved } from "#core/events/approval-resolved.event";
import { RunCompleted } from "#core/events/run-completed.event";
import type { RunApproval } from "#node/models/run-approval.model";
import type { RunStep } from "#node/models/run-step.model";
import type { Run } from "#node/models/run.model";
import type { ToolCall } from "#node/models/tool-call.model";

/** A run row as the port's record. */
function runOf(row: Run): RunRecord {
  return Object.freeze({
    id: row.id,
    conversationId: row.conversationId,
    agent: row.agent,
    actor: row.actor,
    ...(row.scope === null ? {} : { scope: row.scope }),
    ...(row.recordKind === null
      ? {}
      : {
          record: { kind: row.recordKind, ...(row.recordId === null ? {} : { id: row.recordId }) },
        }),
    status: row.status,
    ...(row.pendingApprovalId === null || row.pendingToolCallId === null
      ? {}
      : { pending: { approvalId: row.pendingApprovalId, toolCallId: row.pendingToolCallId } }),
    steps: row.steps,
    ...(row.errorCode === null ? {} : { errorCode: row.errorCode }),
    startedAt: row.createdAt,
    ...(row.finishedAt === null ? {} : { finishedAt: row.finishedAt }),
  });
}

/** A tool call row as the port's record. */
function toolCallOf(row: ToolCall): ToolCallRecord {
  return Object.freeze({
    runId: row.runId,
    toolCallId: row.toolCallId,
    tool: row.tool,
    inputHash: row.inputHash,
    outcome: row.outcome,
    ...(row.code === null ? {} : { code: row.code }),
    ...(row.approvalId === null ? {} : { approvalId: row.approvalId }),
    at: row.at,
  });
}

/** An approval row as the port's record. */
function approvalOf(row: RunApproval): RunApprovalRecord {
  return Object.freeze({
    approvalId: row.approvalId,
    runId: row.runId,
    toolCallId: row.toolCallId,
    tool: row.tool,
    status: row.status,
    at: row.updatedAt,
  });
}

/**
 * Stores runs in Postgres.
 *
 * @example
 * container.bind(RunStore, PostgresRunStoreDriver);
 */
export class PostgresRunStoreDriver extends Driver(RunStore) {
  private readonly runs: Repository<Run>;

  private readonly steps: Repository<RunStep>;

  private readonly calls: Repository<ToolCall>;

  private readonly decisions: Repository<RunApproval>;

  /**
   * @param runs - the run rows.
   * @param steps - the step rows.
   * @param calls - the tool call rows.
   * @param decisions - the approval rows.
   */
  constructor(
    runs: Repository<Run>,
    steps: Repository<RunStep>,
    calls: Repository<ToolCall>,
    decisions: Repository<RunApproval>,
  ) {
    super();
    this.runs = runs;
    this.steps = steps;
    this.calls = calls;
    this.decisions = decisions;
  }

  /** Implements `RunStore.create`, documented there. */
  async create(run: {
    readonly conversationId: string;
    readonly agent: string;
    readonly actor: Actor;
    readonly scope?: ScopeRef;
    readonly record?: RecordScope;
    readonly status: RunStatus;
  }): Promise<RunRecord> {
    const row = await this.runs.insert({
      conversationId: run.conversationId,
      agent: run.agent,
      actor: run.actor,
      scope: run.scope ?? null,
      recordKind: run.record?.kind ?? null,
      recordId: run.record?.id ?? null,
      status: run.status,
    });
    return runOf(row);
  }

  /** Implements `RunStore.get`, documented there. */
  async get(id: string): Promise<RunRecord | undefined> {
    const row = await this.runs.findOne({ id } as never);
    return row === null ? undefined : runOf(row as Run);
  }

  /**
   * Implements `RunStore.update`, documented there.
   *
   * @throws NotFoundError when the run is not visible.
   * @throws RangeError when it parks on an approval that was not recorded first.
   */
  async update(
    id: string,
    change: {
      readonly status: RunStatus;
      readonly pending?: { readonly approvalId: string; readonly toolCallId: string } | null;
      readonly steps?: number;
      readonly errorCode?: string;
      readonly finishedAt?: Date;
    },
  ): Promise<void> {
    const row = (await this.runs.findOneOrFail({ id } as never)) as Run;
    const parksOn =
      change.status === RunStatus.WaitingApproval && change.pending
        ? ((await this.decisions.findOne({
            approvalId: change.pending.approvalId,
          } as never)) as RunApproval | null)
        : undefined;
    if (parksOn === null)
      throw new RangeError(
        `Run ${id} parks on approval ${change.pending?.approvalId ?? ""}, which was not recorded first`,
      );
    row.status = change.status;
    if (change.pending !== undefined) {
      row.pendingApprovalId = change.pending?.approvalId ?? null;
      row.pendingToolCallId = change.pending?.toolCallId ?? null;
    }
    if (change.steps !== undefined) row.steps = change.steps;
    if (change.errorCode !== undefined) row.errorCode = change.errorCode;
    if (change.finishedAt !== undefined) row.finishedAt = change.finishedAt;
    if (parksOn !== undefined)
      recordEvent(
        row,
        ApprovalRequested.create({
          runId: row.id,
          agent: row.agent,
          approvalId: parksOn.approvalId,
          tool: parksOn.tool,
        }),
      );
    if (change.status === RunStatus.Completed || change.status === RunStatus.Failed)
      recordEvent(
        row,
        RunCompleted.create({
          runId: row.id,
          agent: row.agent,
          status: change.status,
          steps: row.steps,
          errorCode: row.errorCode,
        }),
      );
  }

  /** Implements `RunStore.recordStep`, documented there. */
  async recordStep(step: RunStepRecord): Promise<void> {
    await this.steps.insert({ ...step });
  }

  /** Implements `RunStore.recordToolCall`, documented there. */
  async recordToolCall(call: ToolCallRecord): Promise<void> {
    await this.calls.insert({
      ...call,
      code: call.code ?? null,
      approvalId: call.approvalId ?? null,
    });
  }

  /** Implements `RunStore.recordApproval`, documented there. */
  async recordApproval(approval: RunApprovalRecord): Promise<void> {
    const row = (await this.decisions.findOne({
      approvalId: approval.approvalId,
    } as never)) as RunApproval | null;
    if (row === null) {
      const { at: _at, ...fields } = approval;
      await this.decisions.insert(fields);
      return;
    }
    const wasPending = row.status === RunApprovalStatus.Pending;
    row.status = approval.status;
    if (wasPending && approval.status !== RunApprovalStatus.Pending)
      recordEvent(
        row,
        ApprovalResolved.create({
          runId: row.runId as PublicId<"airun">,
          approvalId: row.approvalId,
          tool: row.tool,
          status: approval.status,
        }),
      );
  }

  /** Implements `RunStore.toolCalls`, documented there. */
  async toolCalls(runId: string): Promise<readonly ToolCallRecord[]> {
    const rows = (await this.calls.find(
      { runId } as never,
      { orderBy: { at: "asc" } } as never,
    )) as ToolCall[];
    return rows.map(toolCallOf);
  }

  /** Implements `RunStore.approvals`, documented there. */
  async approvals(runId: string): Promise<readonly RunApprovalRecord[]> {
    const rows = (await this.decisions.find(
      { runId } as never,
      {
        orderBy: { createdAt: "asc" },
      } as never,
    )) as RunApproval[];
    return rows.map(approvalOf);
  }
}
