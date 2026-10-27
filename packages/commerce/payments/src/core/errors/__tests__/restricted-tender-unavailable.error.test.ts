/**
 * Stackra file contract:
 * Purpose: unit tests of `RestrictedTenderUnavailableError`: a failed_precondition refusal with its code, not retryable,
 *          carrying the Market and program.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140; ADR 0445.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { RestrictedTenderUnavailableError } from "#core/errors/restricted-tender-unavailable.error";

describe("RestrictedTenderUnavailableError", () => {
  it("is a failed_precondition refusal carrying the Market and program", () => {
    const refusal = RestrictedTenderUnavailableError.create({ market: "xa", program: "snap" });
    expect(isRefusal(refusal, RestrictedTenderUnavailableError)).toBe(true);
    expect(refusal.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refusal.code).toBe("restricted_tender_unavailable");
    expect(refusal.retryable).toBe(false);
    expect(refusal.details).toEqual({ market: "xa", program: "snap" });
  });
});
