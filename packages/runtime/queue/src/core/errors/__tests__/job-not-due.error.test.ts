/**
 * Stackra file contract:
 * Purpose: unit test of `JobNotDueError`: a retryable Unavailable refusal with code `job_not_due` and the due time.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0148 (decision 3).
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { JobNotDueError } from "#core/errors/job-not-due.error";

describe("JobNotDueError", () => {
  it("is a retryable Unavailable refusal with code job_not_due and the due time", () => {
    const refused = JobNotDueError.create({ runAt: "2026-10-27T12:00:00.000Z" });
    expect(isRefusal(refused, JobNotDueError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Unavailable);
    expect(refused.toEnvelope()).toEqual({
      code: "job_not_due",
      category: "unavailable",
      retryable: true,
      details: { runAt: "2026-10-27T12:00:00.000Z" },
    });
  });
});
