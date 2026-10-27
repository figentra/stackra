/**
 * Stackra file contract:
 * Purpose: the `RunStore` port: keeps agent runs with their steps, tool calls and approvals, so a run can be queued,
 *          parked on an approval and resumed, and every tool call and approval is on record per run.
 * Boundary: an abstract class that is its own token, keyed `ai.RunStore`. The Postgres driver in `./node` stores
 *           `ai.runs`, `ai.steps`, `ai.tool_calls` and `ai.approvals` under the tenant's row-level security; the memory
 *           driver in `.` serves tests and local runs. No text: hashes, codes and counts only (ADR 0100 decision 9).
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decisions 2, 3, 9 and 10); ADR 0399 (storage home); STA-781.
 */
import { type Actor, Port, type ScopeRef } from "@stackra/contracts";

import type { RunStatus } from "#contracts/enums/run-status.enum";
import type { RecordScope } from "#contracts/types/record-scope.type";
import type { RunApprovalRecord } from "#contracts/types/run-approval-record.type";
import type { RunRecord } from "#contracts/types/run-record.type";
import type { RunStepRecord } from "#contracts/types/run-step-record.type";
import type { ToolCallRecord } from "#contracts/types/tool-call-record.type";

/**
 * Stores agent runs with their steps, tool calls and approvals.
 *
 * @example
 * const run = await runs.create({ conversationId, agent: "matter_assistant", actor, status: RunStatus.Running });
 * await runs.update(run.id, { status: RunStatus.Completed, finishedAt: new Date() });
 */
export abstract class RunStore extends Port {
  /** Type-only port key, so `DriverName<RunStore>` narrows to this port's drivers. */
  declare readonly "~key": "ai.RunStore";

  /** Creates a run with no steps. */
  abstract create(run: {
    readonly conversationId: string;
    readonly agent: string;
    readonly actor: Actor;
    readonly scope?: ScopeRef;
    readonly record?: RecordScope;
    readonly status: RunStatus;
  }): Promise<RunRecord>;

  /** The run with `id`, or `undefined` when none is visible. */
  abstract get(id: string): Promise<RunRecord | undefined>;

  /** Changes the run's status and bookkeeping; `pending: null` clears the parked call. */
  abstract update(
    id: string,
    change: {
      readonly status: RunStatus;
      readonly pending?: { readonly approvalId: string; readonly toolCallId: string } | null;
      readonly steps?: number;
      readonly errorCode?: string;
      readonly finishedAt?: Date;
    },
  ): Promise<void>;

  /** Records one model step. */
  abstract recordStep(step: RunStepRecord): Promise<void>;

  /** Records one tool call. */
  abstract recordToolCall(call: ToolCallRecord): Promise<void>;

  /** Records an approval, or its new status when the id is already recorded. */
  abstract recordApproval(approval: RunApprovalRecord): Promise<void>;

  /** The run's tool calls, in order. */
  abstract toolCalls(runId: string): Promise<readonly ToolCallRecord[]>;

  /** The run's approvals, in order of first record. */
  abstract approvals(runId: string): Promise<readonly RunApprovalRecord[]>;
}
