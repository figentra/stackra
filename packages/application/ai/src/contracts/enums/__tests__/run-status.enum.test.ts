/**
 * Stackra file contract:
 * Purpose: unit tests of the run vocabulary: `RunStatus`, `ToolCallOutcome` and `RunApprovalStatus` hold exactly their
 *          snake_case codes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0231; ADR 0100 (decision 10).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { RunApprovalStatus } from "#contracts/enums/run-approval-status.enum";
import { RunStatus } from "#contracts/enums/run-status.enum";
import { ToolCallOutcome } from "#contracts/enums/tool-call-outcome.enum";

describe("RunStatus", () => {
  it("holds the run states", () => {
    expect(Enum.values(RunStatus)).toEqual([
      "queued",
      "running",
      "waiting_approval",
      "completed",
      "failed",
    ]);
  });

  it("is joined by the tool call outcomes and approval statuses", () => {
    expect(Enum.values(ToolCallOutcome)).toEqual([
      "ok",
      "refused",
      "approval_required",
      "proposed",
    ]);
    expect(Enum.values(RunApprovalStatus)).toEqual(["pending", "granted", "denied"]);
  });
});
