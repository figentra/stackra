/**
 * Stackra file contract:
 * Purpose: unit tests of `ScopeNotPlatformWrittenError`: a non-retryable Forbidden refusal with code
 *          `scope_not_platform_written` and no details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0098.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ScopeNotPlatformWrittenError } from "#core/errors/scope-not-platform-written.error";

describe("ScopeNotPlatformWrittenError", () => {
  it("is a Forbidden refusal that is not retried, with code scope_not_platform_written and no details", () => {
    const refused = ScopeNotPlatformWrittenError.create();
    expect(isRefusal(refused, ScopeNotPlatformWrittenError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Forbidden);
    expect(refused.retryable).toBe(false);
    expect(refused.code).toBe("scope_not_platform_written");
    expect(refused.details).toEqual({});
  });
});
