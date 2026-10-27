/**
 * Stackra file contract:
 * Purpose: unit tests of `SoftPosUnavailableError`: a failed_precondition refusal with its code, not retryable,
 *          carrying the provider and reason.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140; ADR 0446.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { SoftPosUnavailableError } from "#core/errors/soft-pos-unavailable.error";

describe("SoftPosUnavailableError", () => {
  it("is a failed_precondition refusal carrying the provider and reason", () => {
    const refusal = SoftPosUnavailableError.create({
      provider: "stripe",
      reason: "unsupported_device",
    });
    expect(isRefusal(refusal, SoftPosUnavailableError)).toBe(true);
    expect(refusal.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refusal.code).toBe("soft_pos_unavailable");
    expect(refusal.retryable).toBe(false);
    expect(refusal.details).toEqual({ provider: "stripe", reason: "unsupported_device" });
  });
});
