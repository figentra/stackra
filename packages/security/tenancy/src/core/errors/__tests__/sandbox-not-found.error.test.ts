/**
 * Stackra file contract:
 * Purpose: unit tests of `SandboxNotFoundError`: code `sandbox_not_found`, kind `NotFound`, not retryable, with its details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { SandboxNotFoundError } from "#core/errors/sandbox-not-found.error";

describe("SandboxNotFoundError", () => {
  it("is a non-retryable NotFound refusal", () => {
    const error = SandboxNotFoundError.create();
    expect(isRefusal(error)).toBe(true);
    expect(error.code).toBe("sandbox_not_found");
    expect(error.kind).toBe(ErrorKind.NotFound);
    expect(error.retryable).toBe(false);
    expect(error.details).toEqual({});
  });
});
