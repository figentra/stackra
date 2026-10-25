/**
 * Stackra file contract:
 * Purpose: unit tests of `OfflineCapReachedError`: a `precondition_failed` refusal with code `offline_cap_reached`, not
 *          retryable, whose typed `create` takes the refused action key.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0338 (decision 5); R-02 (typed `create`).
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { OfflineCapReachedError } from "#core/errors/offline-cap-reached.error";

describe("OfflineCapReachedError", () => {
  it("is a precondition_failed refusal with code offline_cap_reached", () => {
    const refused = OfflineCapReachedError.create({ action: "loyalty.gift_card.redeem@1" });
    expect(isRefusal(refused, OfflineCapReachedError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refused.code).toBe("offline_cap_reached");
    expect(refused.retryable).toBe(false);
    expect(OfflineCapReachedError.envelope({ action: "loyalty.gift_card.redeem@1" })).toEqual({
      code: "offline_cap_reached",
      category: "precondition_failed",
      retryable: false,
      details: { action: "loyalty.gift_card.redeem@1" },
    });
  });
});
