/**
 * Stackra file contract:
 * Purpose: unit tests of `TenantMembershipMissingError`: a refusal of kind `Forbidden` with code
 *          `tenant_membership_missing` (HTTP 403), not retryable, with no details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; R-02.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { TenantMembershipMissingError } from "#core/errors/tenant-membership-missing.error";

describe("TenantMembershipMissingError", () => {
  it("is a Forbidden refusal with code tenant_membership_missing and no details", () => {
    const refused = TenantMembershipMissingError.create();
    expect(isRefusal(refused, TenantMembershipMissingError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Forbidden);
    expect(refused.code).toBe("tenant_membership_missing");
    expect(refused.retryable).toBe(false);
    expect(refused.details).toEqual({});
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(403);
  });
});
