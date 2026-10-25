/**
 * Stackra file contract:
 * Purpose: unit tests of `ShareTransitionInvalidError`: code `share_transition_invalid`, kind `FailedPrecondition`, not retryable, with its details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ShareTransitionInvalidError } from "#core/errors/share-transition-invalid.error";

describe("ShareTransitionInvalidError", () => {
  it("is a non-retryable FailedPrecondition refusal", () => {
    const error = ShareTransitionInvalidError.create();
    expect(isRefusal(error)).toBe(true);
    expect(error.code).toBe("share_transition_invalid");
    expect(error.kind).toBe(ErrorKind.FailedPrecondition);
    expect(error.retryable).toBe(false);
    expect(error.details).toEqual({});
  });
});
