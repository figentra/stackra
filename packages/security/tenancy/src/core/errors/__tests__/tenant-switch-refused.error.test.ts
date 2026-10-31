/**
 * Stackra file contract:
 * Purpose: unit tests of `TenantSwitchRefusedError`: a non-retryable FailedPrecondition refusal with code
 *          `tenant_switch_refused` and no details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0495.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { TenantSwitchRefusedError } from "#core/errors/tenant-switch-refused.error";

describe("TenantSwitchRefusedError", () => {
  it("is a FailedPrecondition refusal with code tenant_switch_refused and no details", () => {
    const refused = TenantSwitchRefusedError.create();
    expect(isRefusal(refused, TenantSwitchRefusedError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refused.code).toBe("tenant_switch_refused");
    expect(refused.retryable).toBe(false);
    expect(refused.details).toEqual({});
  });
});
