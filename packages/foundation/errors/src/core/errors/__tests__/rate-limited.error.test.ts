/**
 * Stackra file contract:
 * Purpose: unit tests of `RateLimitedError`: a refusal of kind `RateLimited` with code `rate_limited`, category `rate_limited` (HTTP 429),
 *          retryable, carrying no details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0140.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ErrorKind } from "#core/enums/error-kind.enum";
import { RateLimitedError } from "#core/errors/rate-limited.error";
import { isRefusal } from "#core/functions/is-refusal.function";

describe("RateLimitedError", () => {
  it("is a RateLimited refusal with code rate_limited", () => {
    const refused = RateLimitedError.create();
    expect(isRefusal(refused, RateLimitedError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.RateLimited);
    expect(refused.code).toBe("rate_limited");
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(429);
  });

  it("has the envelope of ADR 0140 with no details", () => {
    expect(RateLimitedError.envelope()).toEqual({
      code: "rate_limited",
      category: "rate_limited",
      retryable: true,
    });
  });
});
