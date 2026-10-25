/**
 * Stackra file contract:
 * Purpose: unit tests of `PromotionBaseStaleError`: code `promotion_base_stale`, kind Conflict, not retryable, its details on the wire.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0359 (decision 6).
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { PromotionBaseStaleError } from "#core/errors/promotion-base-stale.error";

describe(PromotionBaseStaleError, () => {
  const refusal = PromotionBaseStaleError.create({
    promotable: "settings",
    base: "a1",
    live: "b2",
  });

  it("is a refusal with its derived code and kind", () => {
    expect(isRefusal(refusal, PromotionBaseStaleError)).toBe(true);
    expect(refusal.code).toBe("promotion_base_stale");
    expect(refusal.kind).toBe(ErrorKind.Conflict);
    expect(refusal.retryable).toBe(false);
  });

  it("carries its details on the wire", () => {
    expect(refusal.details).toEqual({ promotable: "settings", base: "a1", live: "b2" });
    expect(refusal.toEnvelope()).toMatchObject({ code: "promotion_base_stale" });
  });
});
