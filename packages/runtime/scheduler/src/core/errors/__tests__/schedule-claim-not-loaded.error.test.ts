/**
 * Stackra file contract:
 * Purpose: unit tests of `ScheduleClaimNotLoadedError`: an `Internal` refusal that is not retried, with code `schedule_claim_not_loaded` and the claimed id as its
 *          one detail.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0239 (2026-11-07 amendment, gap A).
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ScheduleClaimNotLoadedError } from "#core/errors/schedule-claim-not-loaded.error";

describe("ScheduleClaimNotLoadedError", () => {
  it("is a Internal refusal, not retried, with code schedule_claim_not_loaded and the claimed id", () => {
    const refused = ScheduleClaimNotLoadedError.create({ id: "sch_A" });
    expect(isRefusal(refused, ScheduleClaimNotLoadedError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Internal);
    expect(refused.retryable).toBe(false);
    expect(refused.code).toBe("schedule_claim_not_loaded");
    expect(refused.details).toEqual({ id: "sch_A" });
  });
});
