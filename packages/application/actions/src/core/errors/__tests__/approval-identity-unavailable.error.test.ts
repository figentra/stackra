/**
 * Stackra file contract:
 * Purpose: unit tests of `ApprovalIdentityUnavailableError`: a `Unavailable` refusal with code `approval_identity_unavailable`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0509; ADR 0140.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ApprovalIdentityUnavailableError } from "#core/errors/approval-identity-unavailable.error";

describe("ApprovalIdentityUnavailableError", () => {
  it("is approval_identity_unavailable", () => {
    const refused = ApprovalIdentityUnavailableError.create();
    expect(isRefusal(refused, ApprovalIdentityUnavailableError)).toBe(true);
    expect(refused.code).toBe("approval_identity_unavailable");
    expect(refused.kind).toBe(ErrorKind.Unavailable);
    expect(refused.retryable).toBe(true);
  });
});
