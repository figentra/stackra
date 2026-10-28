/**
 * Stackra file contract:
 * Purpose: unit tests of `rateLimitHeaders`: a `RateLimitedError` with its details gives `Retry-After`,
 *          `RateLimit-Reset` (seconds, rounded up), `RateLimit-Limit` and `RateLimit-Remaining`; a missing or
 *          non-finite detail gives no header; any other value gives none.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0217; STA-1477.
 */
import { describe, expect, it } from "@stackra/testing";

import { NotFoundError } from "#core/errors/not-found.error";
import { RateLimitedError } from "#core/errors/rate-limited.error";
import { rateLimitHeaders } from "#core/functions/rate-limit-headers.function";

describe(rateLimitHeaders, () => {
  it("turns the refusal's details into the headers", () => {
    expect(
      rateLimitHeaders(RateLimitedError.create({ retryAfterMs: 2500, limit: 20, remaining: 0 })),
    ).toEqual({
      "Retry-After": "3",
      "RateLimit-Reset": "3",
      "RateLimit-Limit": "20",
      "RateLimit-Remaining": "0",
    });
  });

  it("sends only the headers whose detail is there", () => {
    expect(rateLimitHeaders(RateLimitedError.create())).toEqual({});
    expect(rateLimitHeaders(RateLimitedError.create({ retryAfterMs: Infinity, limit: 5 }))).toEqual(
      {
        "RateLimit-Limit": "5",
      },
    );
  });

  it("gives nothing for another refusal or a plain error", () => {
    expect(rateLimitHeaders(NotFoundError.create())).toEqual({});
    expect(rateLimitHeaders(new Error("boom"))).toEqual({});
  });
});
