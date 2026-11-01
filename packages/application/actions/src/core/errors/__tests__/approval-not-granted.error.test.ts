/**
 * Stackra file contract:
 * Purpose: unit tests of `ApprovalNotGrantedError`: a `FailedPrecondition` refusal with code `approval_not_granted`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0509; ADR 0140.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ApprovalNotGrantedError } from "#core/errors/approval-not-granted.error";

describe("ApprovalNotGrantedError", () => {
  it("is approval_not_granted", () => {
    const refused = ApprovalNotGrantedError.create();
    expect(isRefusal(refused, ApprovalNotGrantedError)).toBe(true);
    expect(refused.code).toBe("approval_not_granted");
    expect(refused.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refused.retryable).toBe(false);
  });
});
