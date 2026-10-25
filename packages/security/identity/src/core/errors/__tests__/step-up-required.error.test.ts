/**
 * Stackra file contract:
 * Purpose: unit tests of `StepUpRequiredError`: kind `Unauthenticated`, retryable false, with its details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { StepUpRequiredError } from "#core/errors/step-up-required.error";

describe("StepUpRequiredError", () => {
  it("is a Unauthenticated refusal", () => {
    const error = StepUpRequiredError.create({ required: "aal2" });
    expect(isRefusal(error)).toBe(true);
    expect(error.code).toBe("step_up_required");
    expect(error.kind).toBe(ErrorKind.Unauthenticated);
    expect(error.retryable).toBe(false);
    expect(error.details).toEqual({ required: "aal2" });
  });
});
