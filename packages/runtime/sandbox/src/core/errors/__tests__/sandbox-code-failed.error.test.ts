/**
 * Stackra file contract:
 * Purpose: unit tests of `SandboxCodeFailedError`: a refusal of kind `FailedPrecondition` with code
 *          `sandbox_code_failed` (HTTP 412), not retryable, whose details are the code's error, its logs and its
 *          milliseconds.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0154; R-02.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { SandboxCodeFailedError } from "#core/errors/sandbox-code-failed.error";

describe("SandboxCodeFailedError", () => {
  it("is a FailedPrecondition refusal with code sandbox_code_failed", () => {
    const refused = SandboxCodeFailedError.create({
      failure: "TypeError: x is undefined",
      logs: ["start"],
      codeMs: 12,
    });
    expect(isRefusal(refused, SandboxCodeFailedError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refused.code).toBe("sandbox_code_failed");
    expect(refused.retryable).toBe(false);
    expect(refused.details).toEqual({
      failure: "TypeError: x is undefined",
      logs: ["start"],
      codeMs: 12,
    });
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(412);
  });
});
