/**
 * Stackra file contract:
 * Purpose: unit tests of `TenantRequiredError`: a refusal of kind `FailedPrecondition` with code `tenant_required`
 *          (HTTP 412), not retryable, with no details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; R-02.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { TenantRequiredError } from "#core/errors/tenant-required.error";

describe("TenantRequiredError", () => {
  it("is a FailedPrecondition refusal with code tenant_required and no details", () => {
    const refused = TenantRequiredError.create();
    expect(isRefusal(refused, TenantRequiredError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refused.code).toBe("tenant_required");
    expect(refused.retryable).toBe(false);
    expect(refused.details).toEqual({});
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(412);
  });
});
