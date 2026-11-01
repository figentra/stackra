/**
 * Stackra file contract:
 * Purpose: unit tests of `TenantScopeUnresolvedError`: a non-retryable FailedPrecondition refusal with code
 *          `tenant_scope_unresolved` and no details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0495.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { TenantScopeUnresolvedError } from "#core/errors/tenant-scope-unresolved.error";

describe("TenantScopeUnresolvedError", () => {
  it("is a FailedPrecondition refusal with code tenant_scope_unresolved and no details", () => {
    const refused = TenantScopeUnresolvedError.create();
    expect(isRefusal(refused, TenantScopeUnresolvedError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refused.code).toBe("tenant_scope_unresolved");
    expect(refused.retryable).toBe(false);
    expect(refused.details).toEqual({});
  });
});
