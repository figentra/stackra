/**
 * Stackra file contract:
 * Purpose: unit tests of `JobTimedOutError`: a retryable `Unavailable` refusal with code `job_timed_out` whose one
 *          detail is the timeout.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0148 (decision 1).
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { JobTimedOutError } from "#core/errors/job-timed-out.error";

describe("JobTimedOutError", () => {
  it("is a retryable Unavailable refusal with code job_timed_out and the timeout", () => {
    const refused = JobTimedOutError.create({ timeout: "PT5M" });
    expect(isRefusal(refused, JobTimedOutError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Unavailable);
    expect(refused.retryable).toBe(true);
    expect(refused.toEnvelope()).toEqual({
      code: "job_timed_out",
      category: "unavailable",
      retryable: true,
      details: { timeout: "PT5M" },
    });
  });
});
