/**
 * Stackra file contract:
 * Purpose: unit tests of `ApprovalExpiredError`: a `FailedPrecondition` refusal with code `approval_expired`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0509; ADR 0140.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ApprovalExpiredError } from "#core/errors/approval-expired.error";

describe("ApprovalExpiredError", () => {
  it("is approval_expired", () => {
    const refused = ApprovalExpiredError.create();
    expect(isRefusal(refused, ApprovalExpiredError)).toBe(true);
    expect(refused.code).toBe("approval_expired");
    expect(refused.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refused.retryable).toBe(false);
  });
});
