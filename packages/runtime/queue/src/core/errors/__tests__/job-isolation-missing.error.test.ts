/**
 * Stackra file contract:
 * Purpose: unit tests of `JobIsolationMissingError`: a non-retryable FailedPrecondition refusal with code
 *          `job_isolation_missing` and the stored key as its one detail.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0495.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { JobIsolationMissingError } from "#core/errors/job-isolation-missing.error";

describe("JobIsolationMissingError", () => {
  it("is a FailedPrecondition refusal that is not retried, with code job_isolation_missing and the key", () => {
    const refused = JobIsolationMissingError.create({ key: "messages.message.deliver@1" });
    expect(isRefusal(refused, JobIsolationMissingError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refused.retryable).toBe(false);
    expect(refused.code).toBe("job_isolation_missing");
    expect(refused.details).toEqual({ key: "messages.message.deliver@1" });
  });
});
