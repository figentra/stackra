/**
 * Stackra file contract:
 * Purpose: unit tests of `TenantScopeMismatchError`: a non-retryable Forbidden refusal with code
 *          `tenant_scope_mismatch` and no details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0495.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { TenantScopeMismatchError } from "#core/errors/tenant-scope-mismatch.error";

describe("TenantScopeMismatchError", () => {
  it("is a Forbidden refusal with code tenant_scope_mismatch and no details", () => {
    const refused = TenantScopeMismatchError.create();
    expect(isRefusal(refused, TenantScopeMismatchError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Forbidden);
    expect(refused.code).toBe("tenant_scope_mismatch");
    expect(refused.retryable).toBe(false);
    expect(refused.details).toEqual({});
  });
});
