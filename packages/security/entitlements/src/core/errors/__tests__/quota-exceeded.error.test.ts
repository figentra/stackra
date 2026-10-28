/**
 * Stackra file contract:
 * Purpose: unit and type tests of `QuotaExceededError`: a refusal of kind `EntitlementRequired` with code
 *          `quota_exceeded` (HTTP 402), not retryable, whose typed `create` takes the key, meter, limit and reset.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0140; ADR 0216;
 *                     stackra-309.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { QuotaExceededError } from "#core/errors/quota-exceeded.error";

const details = {
  entitlement: "ai.token_quota",
  meter: "ai.tokens",
  limit: 1000,
  resetsAt: "2026-11-01T00:00:00.000Z",
};

describe("QuotaExceededError", () => {
  it("is an EntitlementRequired refusal with code quota_exceeded", () => {
    const refused = QuotaExceededError.create(details);
    expect(isRefusal(refused, QuotaExceededError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.EntitlementRequired);
    expect(refused.code).toBe("quota_exceeded");
    expect(refused.retryable).toBe(false);
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(402);
  });

  it("carries its details in its envelope", () => {
    expect(QuotaExceededError.envelope(details)).toEqual({
      code: "quota_exceeded",
      category: "entitlement_required",
      retryable: false,
      details,
    });
  });

  it("requires its details", () => {
    // @ts-expect-error -- the key, meter, limit and reset are required
    expect(QuotaExceededError.create().code).toBe("quota_exceeded");
  });
});
