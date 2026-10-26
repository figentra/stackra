/**
 * Stackra file contract:
 * Purpose: unit tests of `WorkflowRunStatus`: the six snake_case codes, in order, as the journal's check constraint
 *          lists them.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0102 (decisions 1 and 2).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { WorkflowRunStatus } from "#core/enums/workflow-run-status.enum";

describe("WorkflowRunStatus", () => {
  it("lists the run statuses as snake_case codes", () => {
    expect(Enum.values(WorkflowRunStatus)).toEqual([
      "running",
      "waiting",
      "completed",
      "compensating",
      "compensated",
      "failed",
      "cancelled",
    ]);
    expect(WorkflowRunStatus.Compensated).toBe("compensated");
  });

  it("types a value as one of the codes", () => {
    expectTypeOf<WorkflowRunStatus>().toEqualTypeOf<
      "running" | "waiting" | "completed" | "compensating" | "compensated" | "failed" | "cancelled"
    >();
  });
});
