/**
 * Stackra file contract:
 * Purpose: unit tests of the three ADR 0100 decision 11 events: their names, version 1, built frozen from the shipped
 *          schemas, and refusing a status outside the event's.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0100 (decision 11); ADR 0141.
 */
import { kindOf } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";

import { APPROVAL_REQUESTED_SCHEMA } from "#core/constants/approval-requested-schema.constant";
import { APPROVAL_RESOLVED_SCHEMA } from "#core/constants/approval-resolved-schema.constant";
import { RUN_COMPLETED_SCHEMA } from "#core/constants/run-completed-schema.constant";
import { ApprovalRequested } from "#core/events/approval-requested.event";
import { ApprovalResolved } from "#core/events/approval-resolved.event";
import { RunCompleted } from "#core/events/run-completed.event";

const runId = "airun_01j9z3k4m5n6p7q8r9s0t1v2w3" as PublicId<"airun">;

describe("ai integration events", () => {
  it("are the three ADR 0100 events, each from its shipped schema", () => {
    expect(kindOf(ApprovalRequested)?.options).toMatchObject({
      name: "approval.requested",
      version: 1,
    });
    expect(kindOf(ApprovalResolved)?.options).toMatchObject({
      name: "approval.resolved",
      version: 1,
    });
    expect(kindOf(RunCompleted)?.options).toMatchObject({ name: "run.completed", version: 1 });
    expect(schemaOf(ApprovalRequested)).toBe(APPROVAL_REQUESTED_SCHEMA);
    expect(schemaOf(ApprovalResolved)).toBe(APPROVAL_RESOLVED_SCHEMA);
    expect(schemaOf(RunCompleted)).toBe(RUN_COMPLETED_SCHEMA);
  });

  it("build frozen and refuse a status outside theirs", () => {
    const requested = ApprovalRequested.create({
      runId,
      agent: "support",
      approvalId: "apr_1",
      tool: "orders.order.refund",
    });
    expect(Object.isFrozen(requested)).toBe(true);
    expect(() =>
      ApprovalResolved.create({
        runId,
        approvalId: "apr_1",
        tool: "x",
        status: "pending" as "granted",
      }),
    ).toThrow();
    expect(
      RunCompleted.create({
        runId,
        agent: "support",
        status: "failed",
        steps: 3,
        errorCode: "forbidden",
      }),
    ).toMatchObject({ steps: 3 });
  });
});
