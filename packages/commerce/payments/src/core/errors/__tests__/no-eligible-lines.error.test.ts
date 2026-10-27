/**
 * Stackra file contract:
 * Purpose: unit tests of `NoEligibleLinesError`: a failed_precondition refusal with its code, not retryable, carrying
 *          the reference and program.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140; ADR 0445.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { NoEligibleLinesError } from "#core/errors/no-eligible-lines.error";

describe("NoEligibleLinesError", () => {
  it("is a failed_precondition refusal carrying the reference and program", () => {
    const refusal = NoEligibleLinesError.create({ reference: "ord_1", program: "snap" });
    expect(isRefusal(refusal, NoEligibleLinesError)).toBe(true);
    expect(refusal.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refusal.code).toBe("no_eligible_lines");
    expect(refusal.retryable).toBe(false);
    expect(refusal.details).toEqual({ reference: "ord_1", program: "snap" });
  });
});
