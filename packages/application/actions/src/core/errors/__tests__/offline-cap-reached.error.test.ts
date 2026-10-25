/**
 * Stackra file contract:
 * Purpose: unit tests of `OfflineCapReachedError`: code `offline_cap_reached`, the failed-precondition kind, not
 *          retryable, and no details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0338 (decision 5); ADR 0140.
 */
import { ErrorKind } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { OfflineCapReachedError } from "#core/errors/offline-cap-reached.error";

describe("OfflineCapReachedError", () => {
  it("is a precondition refusal without details", () => {
    const refusal = OfflineCapReachedError.create();
    expect(refusal.code).toBe("offline_cap_reached");
    expect(refusal.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refusal.toEnvelope()).toEqual({
      code: "offline_cap_reached",
      category: "precondition_failed",
      retryable: false,
    });
  });
});
