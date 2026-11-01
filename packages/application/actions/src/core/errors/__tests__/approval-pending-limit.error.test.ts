/**
 * Stackra file contract:
 * Purpose: unit tests of `ApprovalPendingLimitError`: a `RateLimited` refusal with code `approval_pending_limit`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0509; ADR 0140.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ApprovalPendingLimitError } from "#core/errors/approval-pending-limit.error";

describe("ApprovalPendingLimitError", () => {
  it("is approval_pending_limit", () => {
    const refused = ApprovalPendingLimitError.create();
    expect(isRefusal(refused, ApprovalPendingLimitError)).toBe(true);
    expect(refused.code).toBe("approval_pending_limit");
    expect(refused.kind).toBe(ErrorKind.RateLimited);
    expect(refused.retryable).toBe(false);
  });
});
