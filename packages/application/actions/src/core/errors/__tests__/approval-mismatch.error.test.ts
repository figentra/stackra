/**
 * Stackra file contract:
 * Purpose: unit tests of `ApprovalMismatchError`: a `Forbidden` refusal with code `approval_mismatch`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0509; ADR 0140.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ApprovalMismatchError } from "#core/errors/approval-mismatch.error";

describe("ApprovalMismatchError", () => {
  it("is approval_mismatch", () => {
    const refused = ApprovalMismatchError.create();
    expect(isRefusal(refused, ApprovalMismatchError)).toBe(true);
    expect(refused.code).toBe("approval_mismatch");
    expect(refused.kind).toBe(ErrorKind.Forbidden);
    expect(refused.retryable).toBe(false);
  });
});
