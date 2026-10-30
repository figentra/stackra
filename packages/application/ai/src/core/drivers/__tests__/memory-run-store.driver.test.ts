/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryRunStoreDriver`: it is a `RunStore`; it creates runs with no steps, updates their
 *          status and parked call (and clears it with `null`) and its parked client tool call, and keeps steps, tool calls and approvals per run, an
 *          approval's later status replacing its first.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0100 (decision 10); STA-781.
 */
import { ActorKind } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { RunApprovalStatus } from "#contracts/enums/run-approval-status.enum";
import { RunStatus } from "#contracts/enums/run-status.enum";
import { ToolCallOutcome } from "#contracts/enums/tool-call-outcome.enum";
import { RunStore } from "#contracts/ports/run-store.port";
import { MemoryRunStoreDriver } from "#core/drivers/memory-run-store.driver";

const at = new Date("2026-10-26T09:00:00.000Z");

describe(MemoryRunStoreDriver, () => {
  it("keeps runs with their steps, tool calls and approvals", async () => {
    const store = new MemoryRunStoreDriver();
    expect(store).toBeInstanceOf(RunStore);
    const run = await store.create({
      conversationId: "aiconv_1",
      agent: "matter_assistant",
      actor: { kind: ActorKind.Agent, id: "agt_1" },
      status: RunStatus.Running,
    });
    expect(run).toMatchObject({ steps: 0, status: RunStatus.Running });
    const pending = { approvalId: "apr_1", toolCallId: "call_1" };
    await store.update(run.id, { status: RunStatus.WaitingApproval, pending, steps: 1 });
    expect(await store.get(run.id)).toMatchObject({ pending, steps: 1 });
    await store.update(run.id, { status: RunStatus.Running, pending: null });
    expect((await store.get(run.id))?.pending).toBeUndefined();
    await expect(store.update("airun_x", { status: RunStatus.Failed })).rejects.toThrow(RangeError);

    await store.recordToolCall({
      runId: run.id,
      toolCallId: "call_1",
      tool: "legal.letter.send@1",
      inputHash: "ab",
      outcome: ToolCallOutcome.ApprovalRequired,
      approvalId: "apr_1",
      at,
    });
    const parked = {
      approvalId: "apr_1",
      runId: run.id,
      toolCallId: "call_1",
      tool: "legal.letter.send@1",
      status: RunApprovalStatus.Pending,
      at,
    };
    await store.recordApproval(parked);
    await store.recordApproval({ ...parked, status: RunApprovalStatus.Granted });
    expect((await store.toolCalls(run.id)).map(({ outcome }) => outcome)).toEqual([
      "approval_required",
    ]);
    expect((await store.approvals(run.id)).map(({ status }) => status)).toEqual(["granted"]);
    expect(await store.toolCalls("airun_other")).toEqual([]);
  });

  it("parks a run on a client tool call and clears it", async () => {
    const store = new MemoryRunStoreDriver();
    const run = await store.create({
      conversationId: "aiconv_1",
      agent: "matter_assistant",
      actor: { kind: ActorKind.Agent, id: "agt_1" },
      status: RunStatus.Running,
    });
    const clientPending = {
      toolCallId: "call_1",
      surfaceId: "srf_1",
      tool: "orders.order.list.filter",
      expiresAt: at,
    };
    await store.update(run.id, { status: RunStatus.WaitingClientTool, clientPending });
    expect(await store.get(run.id)).toMatchObject({ status: "waiting_client_tool", clientPending });
    await store.update(run.id, { status: RunStatus.Running, clientPending: null });
    expect((await store.get(run.id))?.clientPending).toBeUndefined();
  });
});
