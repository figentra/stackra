/**
 * Stackra file contract:
 * Purpose: unit tests of `ApprovalConsumedError`: a `Conflict` refusal with code `approval_consumed`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0509; ADR 0140.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ApprovalConsumedError } from "#core/errors/approval-consumed.error";

describe("ApprovalConsumedError", () => {
  it("is approval_consumed", () => {
    const refused = ApprovalConsumedError.create();
    expect(isRefusal(refused, ApprovalConsumedError)).toBe(true);
    expect(refused.code).toBe("approval_consumed");
    expect(refused.kind).toBe(ErrorKind.Conflict);
    expect(refused.retryable).toBe(false);
  });
});
