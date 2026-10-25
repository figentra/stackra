/**
 * Stackra file contract:
 * Purpose: unit tests of `ApprovalRequiredError`: a FailedPrecondition refusal with code `approval_required`, not
 *          retryable, carrying only the parked request's id.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0098 (decision 3); ADR 0140.
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ApprovalRequiredError } from "#core/errors/approval-required.error";

describe("ApprovalRequiredError", () => {
  it("is approval_required with the request id", () => {
    const refused = ApprovalRequiredError.create({ approvalId: "apr_1" });
    expect(isRefusal(refused, ApprovalRequiredError)).toBe(true);
    expect(refused.approvalId).toBe("apr_1");
    expect(ApprovalRequiredError.envelope({ approvalId: "apr_1" })).toEqual({
      code: "approval_required",
      category: "precondition_failed",
      retryable: false,
      details: { approvalId: "apr_1" },
    });
  });
});
