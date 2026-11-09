/**
 * Stackra file contract:
 * Purpose: unit tests of `ScheduleRowIsolationMissingError`: a `FailedPrecondition` refusal that is not retried, with code `schedule_row_isolation_missing` and the claimed id as its
 *          one detail.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0239 (2026-11-07 amendment, gap A).
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ScheduleRowIsolationMissingError } from "#core/errors/schedule-row-isolation-missing.error";

describe("ScheduleRowIsolationMissingError", () => {
  it("is a FailedPrecondition refusal, not retried, with code schedule_row_isolation_missing and the claimed id", () => {
    const refused = ScheduleRowIsolationMissingError.create({ id: "sch_A" });
    expect(isRefusal(refused, ScheduleRowIsolationMissingError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refused.retryable).toBe(false);
    expect(refused.code).toBe("schedule_row_isolation_missing");
    expect(refused.details).toEqual({ id: "sch_A" });
  });
});
