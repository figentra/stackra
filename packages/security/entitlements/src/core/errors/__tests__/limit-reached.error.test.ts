/**
 * Stackra file contract:
 * Purpose: unit and type tests of `LimitReachedError`: a refusal of kind `EntitlementRequired` with code
 *          `limit_reached` (HTTP 402), not retryable, whose typed `create` takes the entitlement key and the limit.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0140; R-02.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { LimitReachedError } from "#core/errors/limit-reached.error";

describe("LimitReachedError", () => {
  it("is an EntitlementRequired refusal with code limit_reached", () => {
    const refused = LimitReachedError.create({ entitlement: "catalogue.product_limit", limit: 2 });
    expect(isRefusal(refused, LimitReachedError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.EntitlementRequired);
    expect(refused.code).toBe("limit_reached");
    expect(refused.retryable).toBe(false);
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(402);
  });

  it("carries the key and the limit in its envelope", () => {
    expect(
      LimitReachedError.envelope({ entitlement: "catalogue.product_limit", limit: 2 }),
    ).toEqual({
      code: "limit_reached",
      category: "entitlement_required",
      retryable: false,
      details: { entitlement: "catalogue.product_limit", limit: 2 },
    });
  });

  it("requires its details", () => {
    // @ts-expect-error -- `entitlement` and `limit` are required
    expect(LimitReachedError.create().code).toBe("limit_reached");
  });
});
