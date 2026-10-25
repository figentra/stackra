/**
 * Stackra file contract:
 * Purpose: unit tests of `ResolutionReasonRequiredError`: a non-retryable `validation` refusal, code `resolution_reason_required`, whose details are its
 *          fields.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0328.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ResolutionReasonRequiredError } from "#core/errors/resolution-reason-required.error";

describe("ResolutionReasonRequiredError", () => {
  it("is a validation refusal carrying its details", () => {
    const refusal = ResolutionReasonRequiredError.create({ reference: "ord_1" });
    expect(isRefusal(refusal, ResolutionReasonRequiredError)).toBe(true);
    expect(refusal.kind).toBe(ErrorKind.Validation);
    expect(refusal.code).toBe("resolution_reason_required");
    expect(refusal.retryable).toBe(false);
    expect(refusal.details).toEqual({ reference: "ord_1" });
  });
});
