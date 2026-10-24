/**
 * Stackra file contract:
 * Purpose: unit tests of `ScopeUnresolvedError`: a refusal of kind `Forbidden` with code `scope_unresolved` (HTTP 403),
 *          not retryable, with no details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; R-02.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ScopeUnresolvedError } from "#core/errors/scope-unresolved.error";

describe("ScopeUnresolvedError", () => {
  it("is a Forbidden refusal with code scope_unresolved and no details", () => {
    const refused = ScopeUnresolvedError.create();
    expect(isRefusal(refused, ScopeUnresolvedError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Forbidden);
    expect(refused.code).toBe("scope_unresolved");
    expect(refused.retryable).toBe(false);
    expect(refused.details).toEqual({});
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(403);
  });
});
