/**
 * Stackra file contract:
 * Purpose: unit tests of `storedRefusal` and `refusalFromStored`: a refusal round-trips to an equal envelope.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0140.
 */
import { describe, expect, it } from "@stackra/testing";

import { IdempotencyKeyReusedError } from "#core/errors/idempotency-key-reused.error";
import { RateLimitedError } from "#core/errors/rate-limited.error";
import { isRefusal } from "#core/functions/is-refusal.function";
import { refusalFromStored } from "#core/functions/refusal-from-stored.function";
import { storedRefusal } from "#core/functions/stored-refusal.function";

describe("storedRefusal and refusalFromStored", () => {
  it("round-trips code, kind, retryable, details and field errors through JSON", () => {
    const first = RateLimitedError.create(
      { retryAfterMs: 3000, limit: 20 },
      { fieldErrors: { a: "bad" } },
    );
    const again = refusalFromStored(structuredClone(storedRefusal(first)));
    expect(again.toEnvelope()).toEqual(first.toEnvelope());
    expect(again.kind).toBe(first.kind);
    expect(again.code).toBe("rate_limited");
    expect(isRefusal(again, RateLimitedError)).toBe(true);
    expect(again instanceof Error).toBe(true);
  });

  it("keeps a refusal with no details plain", () => {
    const again = refusalFromStored(storedRefusal(IdempotencyKeyReusedError.create()));
    expect(again.toEnvelope()).toEqual(IdempotencyKeyReusedError.envelope());
  });
});
