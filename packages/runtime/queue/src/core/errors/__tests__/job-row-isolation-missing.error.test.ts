/**
 * Stackra file contract:
 * Purpose: unit tests of `JobRowIsolationMissingError`: a `FailedPrecondition` refusal that is not retried, with code
 *          `job_row_isolation_missing` and the claimed id as its one detail.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0495; ADR 0239 (2026-11-07 amendment, gap A).
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { JobRowIsolationMissingError } from "#core/errors/job-row-isolation-missing.error";

describe("JobRowIsolationMissingError", () => {
  it("is a FailedPrecondition refusal, not retried, with code job_row_isolation_missing and the id", () => {
    const refused = JobRowIsolationMissingError.create({ id: "job_A" });
    expect(isRefusal(refused, JobRowIsolationMissingError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refused.retryable).toBe(false);
    expect(refused.code).toBe("job_row_isolation_missing");
    expect(refused.details).toEqual({ id: "job_A" });
  });
});
