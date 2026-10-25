/**
 * Stackra file contract:
 * Purpose: unit tests of `SandboxLimitExceededError`: a refusal of kind `FailedPrecondition` with code
 *          `sandbox_limit_exceeded` (HTTP 412), not retryable, whose details name the limit and the milliseconds.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0154; R-02.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { SandboxLimitExceededError } from "#core/errors/sandbox-limit-exceeded.error";

describe("SandboxLimitExceededError", () => {
  it("is a FailedPrecondition refusal with code sandbox_limit_exceeded", () => {
    const refused = SandboxLimitExceededError.create({ limit: "memory", codeMs: 40 });
    expect(isRefusal(refused, SandboxLimitExceededError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refused.code).toBe("sandbox_limit_exceeded");
    expect(refused.retryable).toBe(false);
    expect(refused.details).toEqual({ limit: "memory", codeMs: 40 });
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(412);
  });

  it("takes only a known limit", () => {
    // @ts-expect-error -- `cpu` is not a limit
    expect(SandboxLimitExceededError.create({ limit: "cpu", codeMs: 1 }).code).toBe(
      "sandbox_limit_exceeded",
    );
  });
});
