/**
 * Stackra file contract:
 * Purpose: unit tests of `CapabilityUnsupportedError`: a non-retryable `failed_precondition` refusal, code `capability_unsupported`, whose details are its
 *          fields.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0328.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { CapabilityUnsupportedError } from "#core/errors/capability-unsupported.error";

describe("CapabilityUnsupportedError", () => {
  it("is a failed_precondition refusal carrying its details", () => {
    const refusal = CapabilityUnsupportedError.create({ provider: "fawry", capability: "capture" });
    expect(isRefusal(refusal, CapabilityUnsupportedError)).toBe(true);
    expect(refusal.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refusal.code).toBe("capability_unsupported");
    expect(refusal.retryable).toBe(false);
    expect(refusal.details).toEqual({ provider: "fawry", capability: "capture" });
  });
});
