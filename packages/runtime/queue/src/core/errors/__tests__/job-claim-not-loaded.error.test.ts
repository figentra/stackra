/**
 * Stackra file contract:
 * Purpose: unit tests of `JobClaimNotLoadedError`: an `Internal` refusal that is not retried, with code
 *          `job_claim_not_loaded` and the claimed id as its one detail.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0239 (2026-11-07 amendment, gap A).
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { JobClaimNotLoadedError } from "#core/errors/job-claim-not-loaded.error";

describe("JobClaimNotLoadedError", () => {
  it("is an Internal refusal, not retried, with code job_claim_not_loaded and the claimed id", () => {
    const refused = JobClaimNotLoadedError.create({ id: "job_A" });
    expect(isRefusal(refused, JobClaimNotLoadedError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Internal);
    expect(refused.retryable).toBe(false);
    expect(refused.code).toBe("job_claim_not_loaded");
    expect(refused.details).toEqual({ id: "job_A" });
  });
});
