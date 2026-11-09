/**
 * Stackra file contract:
 * Purpose: unit tests of `ClaimNotLoadedError`: a `Internal` refusal that is not retried, with code `claim_not_loaded` and the claimed id
 *          as its one detail.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0239 (2026-11-07 amendment, gap A).
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ClaimNotLoadedError } from "#core/errors/claim-not-loaded.error";

describe("ClaimNotLoadedError", () => {
  it("is a Internal refusal, not retried, with code claim_not_loaded and the claimed id", () => {
    const refused = ClaimNotLoadedError.create({ id: "evt_A" });
    expect(isRefusal(refused, ClaimNotLoadedError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Internal);
    expect(refused.retryable).toBe(false);
    expect(refused.code).toBe("claim_not_loaded");
    expect(refused.details).toEqual({ id: "evt_A" });
  });
});
