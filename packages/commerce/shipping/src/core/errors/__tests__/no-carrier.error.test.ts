/**
 * Stackra file contract:
 * Purpose: unit tests of `NoCarrierError`: a non-retryable `failed_precondition` refusal, code `no_carrier`, whose
 *          details are its fields.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0328; ADR 0369 (decision 3).
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { NoCarrierError } from "#core/errors/no-carrier.error";

describe("NoCarrierError", () => {
  it("is a failed_precondition refusal carrying its details", () => {
    const refusal = NoCarrierError.create({ market: "zz", needs: "labels,pickups" });
    expect(isRefusal(refusal, NoCarrierError)).toBe(true);
    expect(refusal.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refusal.code).toBe("no_carrier");
    expect(refusal.retryable).toBe(false);
    expect(refusal.details).toEqual({ market: "zz", needs: "labels,pickups" });
  });
});
