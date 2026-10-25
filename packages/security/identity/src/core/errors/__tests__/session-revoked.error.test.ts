/**
 * Stackra file contract:
 * Purpose: unit tests of `SessionRevokedError`: code `session_revoked`, kind `unauthenticated`, not retryable, no
 *          details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140; ADR 0338 (decision 4); final review R-02.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { SessionRevokedError } from "#core/errors/session-revoked.error";

describe("SessionRevokedError", () => {
  it("is a final unauthenticated refusal with no details", () => {
    const error = SessionRevokedError.create();
    expect(isRefusal(error)).toBe(true);
    expect(error.code).toBe("session_revoked");
    expect(error.kind).toBe(ErrorKind.Unauthenticated);
    expect(error.retryable).toBe(false);
    expect(error.details).toEqual({});
  });
});
