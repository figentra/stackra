/**
 * Stackra file contract:
 * Purpose: unit tests of `LockUnavailableError`: a refusal of kind `Unavailable` with code `lock_unavailable` (HTTP
 *          503), retryable, with no details, so no lock key reaches the envelope.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; R-02.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { LockUnavailableError } from "#core/errors/lock-unavailable.error";

describe("LockUnavailableError", () => {
  it("is a retryable Unavailable refusal with code lock_unavailable and no details", () => {
    const refused = LockUnavailableError.create();
    expect(isRefusal(refused, LockUnavailableError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Unavailable);
    expect(refused.code).toBe("lock_unavailable");
    expect(refused.retryable).toBe(true);
    expect(refused.details).toEqual({});
    expect(refused.toEnvelope()).toEqual({
      code: "lock_unavailable",
      category: "unavailable",
      retryable: true,
    });
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(503);
  });
});
