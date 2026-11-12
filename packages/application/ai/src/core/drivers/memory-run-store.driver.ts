/**
 * Stackra file contract:
 * Purpose: `MemoryRunStoreDriver`, the in-process `RunStore`: runs, steps, tool calls and approvals in memory, for
 *          tests, local runs and evals.
 * Boundary: one process only; a restart loses every run, so a queued or parked run never survives it. A service binds
 *           the Postgres driver of `./node`. Ids are random `airun_` public ids.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decisions 2, 3 and 10); STA-781; ADR 0490 (decision 4).
 */
import { Driver } from "@stackra/container";
import type { Actor, ScopeRef } from "@stackra/contracts";

import type { RunStatus } from "#contracts/enums/run-status.enum";
import { RunStore } from "#contracts/ports/run-store.port";
import type { RecordScope } from "#contracts/types/record-scope.type";
import type { RunApprovalRecord } from "#contracts/types/run-approval-record.type";
import type { RunChange } from "#contracts/types/run-change.type";
import type { RunRecord } from "#contracts/types/run-record.type";
import type { RunStepRecord } from "#contracts/types/run-step-record.type";
import type { ToolCallRecord } from "#contracts/types/tool-call-record.type";

/** Whether `actor` is `principalId`, or acts for them up to two delegations deep (as the Postgres store reads it). */
function actsFor(actor: Actor, principalId: string): boolean {
  return (
    actor.id === principalId ||
    actor.onBehalfOf?.id === principalId ||
    actor.onBehalfOf?.onBehalfOf?.id === principalId
  );
}

/**
 * Keeps runs in memory.
 *
 * @example
 * const runs = new MemoryRunStoreDriver();
 * await runs.toolCalls(reply.runId); // what the run dispatched
 */
export class MemoryRunStoreDriver extends Driver(RunStore) {
  /** Every recorded step, in order. */
  readonly steps: RunStepRecord[] = [];

  /** The runs by id. */
  private readonly rows = new Map<string, RunRecord>();

  /** Every recorded tool call, in order. */
  private readonly calls: ToolCallRecord[] = [];

  /** The approvals by id, in order of first record. */
  private readonly decisions = new Map<string, RunApprovalRecord>();

  /** Implements `RunStore.create`, documented there. */
  async create(run: {
    readonly conversationId: string;
    readonly agent: string;
    readonly actor: Actor;
    readonly scope?: ScopeRef;
    readonly record?: RecordScope;
    readonly status: RunStatus;
  }): Promise<RunRecord> {
    const row: RunRecord = {
      id: `airun_${globalThis.crypto.randomUUID().replaceAll("-", "")}`,
      ...run,
      steps: 0,
      startedAt: new Date(),
    };
    this.rows.set(row.id, row);
    return row;
  }

  /** Implements `RunStore.get`, documented there. */
  async get(id: string): Promise<RunRecord | undefined> {
    return this.rows.get(id);
  }

  /**
   * Implements `RunStore.update`, documented there.
   *
   * @throws RangeError when the run was never created here.
   */
  async update(id: string, change: RunChange): Promise<void> {
    const row = this.rows.get(id);
    if (row === undefined) throw new RangeError(`No run ${id}`);
    const { pending, clientPending, ...rest } = change;
    const next: RunRecord = { ...row, ...rest };
    if (pending === null) delete (next as { pending?: unknown }).pending;
    if (clientPending === null) delete (next as { clientPending?: unknown }).clientPending;
    this.rows.set(id, {
      ...next,
      ...(pending === undefined || pending === null ? {} : { pending }),
      ...(clientPending === undefined || clientPending === null ? {} : { clientPending }),
    });
  }

  /** Implements `RunStore.recordStep`, documented there. */
  async recordStep(step: RunStepRecord): Promise<void> {
    this.steps.push(Object.freeze({ ...step }));
  }

  /** Implements `RunStore.recordToolCall`, documented there. */
  async recordToolCall(call: ToolCallRecord): Promise<void> {
    this.calls.push(Object.freeze({ ...call }));
  }

  /** Implements `RunStore.recordApproval`, documented there. */
  async recordApproval(approval: RunApprovalRecord): Promise<void> {
    this.decisions.set(approval.approvalId, Object.freeze({ ...approval }));
  }

  /** Implements `RunStore.toolCalls`, documented there. */
  async toolCalls(runId: string): Promise<readonly ToolCallRecord[]> {
    return this.calls.filter((call) => call.runId === runId);
  }

  /** Implements `RunStore.approvals`, documented there. */
  async approvals(runId: string): Promise<readonly RunApprovalRecord[]> {
    return [...this.decisions.values()].filter((approval) => approval.runId === runId);
  }

  /** Implements `RunStore.forget`, documented there; this store holds no legal hold. */
  async forget(principalId: string): Promise<number> {
    const ids = new Set(
      [...this.rows.values()].filter((run) => actsFor(run.actor, principalId)).map((run) => run.id),
    );
    for (const list of [this.steps, this.calls])
      for (let index = list.length - 1; index >= 0; index -= 1)
        if (ids.has(list[index]?.runId ?? "")) list.splice(index, 1);
    for (const [approvalId, approval] of this.decisions)
      if (ids.has(approval.runId)) this.decisions.delete(approvalId);
    for (const id of ids) this.rows.delete(id);
    return ids.size;
  }
}
