/**
 * Stackra file contract:
 * Purpose: unit tests of `PostgresRunStoreDriver`: it creates runs with their scope and record, updates the status and
 *          the parked call (cleared with `null`), records steps and tool calls, keeps one approval row per id whose
 *          status a later record changes, and reads them per run; it records `ApprovalRequested` on the run as it
 *          parks, `ApprovalResolved` on the approval as it leaves `pending` and `RunCompleted` as the run ends.
 * Boundary: test only; the repositories are in-memory stand-ins (the unit of work's flush is the database's). The SQL
 *           side is the migration's test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0100 (decisions 10 and 11); ADR 0399.
 */
import { ActorKind } from "@stackra/contracts";
import type { Repository } from "@stackra/database";
import { takeRecordedEvents } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";

import { RunApprovalStatus } from "#contracts/enums/run-approval-status.enum";
import { RunStatus } from "#contracts/enums/run-status.enum";
import { ToolCallOutcome } from "#contracts/enums/tool-call-outcome.enum";
import { RunStore } from "#contracts/ports/run-store.port";
import { ApprovalRequested } from "#core/events/approval-requested.event";
import { ApprovalResolved } from "#core/events/approval-resolved.event";
import { RunCompleted } from "#core/events/run-completed.event";
import { PostgresRunStoreDriver } from "#node/drivers/postgres-run-store.driver";
import type { RunApproval } from "#node/models/run-approval.model";
import type { RunStep } from "#node/models/run-step.model";
import type { Run } from "#node/models/run.model";
import type { ToolCall } from "#node/models/tool-call.model";

const at = new Date("2026-10-26T09:00:00.000Z");

/** An in-memory repository with the defaults the models declare. */
function rowsOf<M extends object>(
  prefix: string,
  defaults: object = {},
): Repository<M> & { readonly rows: M[] } {
  const rows: M[] = [];
  const matches = (row: M, where: object) =>
    Object.entries(where).every(([key, value]) => (row as Record<string, unknown>)[key] === value);
  const one = async (where: object) => rows.find((row) => matches(row, where)) ?? null;
  return {
    rows,
    insert: async (data: object) => {
      const row = {
        id: `${prefix}_01j9z3k4m5n6p7q8r9s0t1v2w${rows.length + 1}`,
        tenantId: "scp_a",
        createdAt: at,
        updatedAt: at,
        ...defaults,
        ...data,
      } as M;
      rows.push(row);
      return row;
    },
    findOne: one,
    findOneOrFail: async (where: object) => {
      const row = await one(where);
      if (row === null) throw new RangeError("not found");
      return row;
    },
    find: async (where: object) => rows.filter((row) => matches(row, where)),
  } as unknown as Repository<M> & { readonly rows: M[] };
}

describe(PostgresRunStoreDriver, () => {
  it("keeps runs with their steps, tool calls and approvals", async () => {
    const runs = rowsOf<Run>("airun", {
      pendingApprovalId: null,
      pendingToolCallId: null,
      steps: 0,
      errorCode: null,
      finishedAt: null,
    });
    const steps = rowsOf<RunStep>("aistep");
    const calls = rowsOf<ToolCall>("aitool");
    const approvals = rowsOf<RunApproval>("aiappr");
    const store = new PostgresRunStoreDriver(runs, steps, calls, approvals);
    expect(store).toBeInstanceOf(RunStore);
    const run = await store.create({
      conversationId: "aiconv_1",
      agent: "matter_assistant",
      actor: { kind: ActorKind.Agent, id: "agt_1" },
      record: { kind: "matter" },
      status: RunStatus.Running,
    });
    expect(run).toMatchObject({ record: { kind: "matter" }, steps: 0, status: "running" });
    expect(run.scope).toBeUndefined();

    const parked = {
      approvalId: "apr_1",
      runId: run.id,
      toolCallId: "call_1",
      tool: "legal.letter.send@1",
      status: RunApprovalStatus.Pending,
      at,
    };
    await store.recordApproval(parked);
    await store.update(run.id, {
      status: RunStatus.WaitingApproval,
      pending: { approvalId: "apr_1", toolCallId: "call_1" },
      steps: 1,
    });
    expect(await store.get(run.id)).toMatchObject({
      status: "waiting_approval",
      pending: { approvalId: "apr_1", toolCallId: "call_1" },
      steps: 1,
    });
    const [runRow] = runs.rows;
    expect(takeRecordedEvents(runRow as object)).toEqual([
      ApprovalRequested.create({
        runId: run.id as never,
        agent: "matter_assistant",
        approvalId: "apr_1",
        tool: "legal.letter.send@1",
      }),
    ]);
    await store.recordApproval({ ...parked, status: RunApprovalStatus.Denied });
    expect(approvals.rows).toHaveLength(1);
    expect((await store.approvals(run.id)).map(({ status }) => status)).toEqual(["denied"]);
    expect(takeRecordedEvents(approvals.rows[0] as object)).toEqual([
      ApprovalResolved.create({
        runId: run.id as never,
        approvalId: "apr_1",
        tool: "legal.letter.send@1",
        status: "denied",
      }),
    ]);
    await store.recordApproval({ ...parked, status: RunApprovalStatus.Denied });
    expect(takeRecordedEvents(approvals.rows[0] as object)).toEqual([]);
    await store.update(run.id, { status: RunStatus.Completed, pending: null, finishedAt: at });
    expect(await store.get(run.id)).toMatchObject({ status: "completed", finishedAt: at });
    expect((await store.get(run.id))?.pending).toBeUndefined();
    expect(takeRecordedEvents(runRow as object)).toEqual([
      RunCompleted.create({
        runId: run.id as never,
        agent: "matter_assistant",
        status: "completed",
        steps: 1,
        errorCode: null,
      }),
    ]);
    await expect(
      store.update(run.id, {
        status: RunStatus.WaitingApproval,
        pending: { approvalId: "apr_unknown", toolCallId: "call_2" },
      }),
    ).rejects.toThrow(RangeError);

    await store.recordStep({
      runId: run.id,
      index: 0,
      finishReason: "stop",
      inputTokens: 3,
      outputTokens: 2,
    });
    expect(steps.rows).toHaveLength(1);
    await store.recordToolCall({
      runId: run.id,
      toolCallId: "call_1",
      tool: "legal.letter.send@1",
      inputHash: "ab",
      outcome: ToolCallOutcome.Refused,
      code: "forbidden",
      at,
    });
    expect(await store.toolCalls(run.id)).toEqual([
      expect.objectContaining({ outcome: "refused", code: "forbidden" }),
    ]);
  });
});
