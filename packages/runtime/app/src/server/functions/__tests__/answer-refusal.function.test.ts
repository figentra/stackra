/**
 * Stackra file contract:
 * Purpose: unit tests of `answerRefusal`: every `ErrorKind` answers the status ADR 0140 and the generator's table give
 *          it (validation 400, unauthenticated 401, entitlement_required 402, forbidden 403, not_found 404, conflict
 *          409, precondition_failed 412, rate_limited 429, unavailable 503, internal 500) with the envelope and the
 *          correlation id; a rate-limited refusal carries its back-off headers and a key still in progress
 *          `Retry-After: 1`.
 * Boundary: test only; refusal classes declared here, one per kind.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0140 (decisions 1 to 3); ADR 0217 (decision 2).
 */
import { Enum } from "@stackra/contracts";
import {
  ErrorKind,
  IdempotencyKeyInProgressError,
  RateLimitedError,
  Refusal,
} from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { answerRefusal } from "#server/functions/answer-refusal.function";

/** The status of each kind: the owner's (ADR 0140 point 2) and the generator's table. */
const STATUS: Readonly<Record<ErrorKind, number>> = {
  [ErrorKind.Validation]: 400,
  [ErrorKind.Unauthenticated]: 401,
  [ErrorKind.EntitlementRequired]: 402,
  [ErrorKind.Forbidden]: 403,
  [ErrorKind.NotFound]: 404,
  [ErrorKind.Conflict]: 409,
  [ErrorKind.FailedPrecondition]: 412,
  [ErrorKind.RateLimited]: 429,
  [ErrorKind.Unavailable]: 503,
  [ErrorKind.Internal]: 500,
};

describe(answerRefusal, () => {
  it("answers every kind with its status and envelope", async () => {
    expect(Object.keys(STATUS).sort()).toEqual([...Enum.values(ErrorKind)].sort());
    for (const kind of Enum.values(ErrorKind)) {
      class SampleRefusedError extends Refusal({ kind }) {
        orderId!: string;
      }
      const response = answerRefusal(SampleRefusedError.create({ orderId: "ord_1" }), "req-1");
      expect(response.status, kind).toBe(STATUS[kind]);
      expect(response.headers.get("content-type")).toContain("application/json");
      expect(await response.json()).toEqual({
        code: "sample_refused",
        category: Enum.meta(ErrorKind, kind).category,
        retryable: Enum.meta(ErrorKind, kind).retryable,
        details: { orderId: "ord_1" },
        correlationId: "req-1",
      });
    }
  });

  it("leaves the correlation id out when none is given", async () => {
    class OrderLockedError extends Refusal({ kind: ErrorKind.Conflict }) {}
    expect(await answerRefusal(OrderLockedError.create()).json()).toEqual({
      code: "order_locked",
      category: "conflict",
      retryable: false,
    });
  });

  it("carries a rate limit's back-off headers and a running key's Retry-After", () => {
    const limited = answerRefusal(
      RateLimitedError.create({ retryAfterMs: 2500, limit: 10, remaining: 0 }),
    );
    expect(limited.status).toBe(429);
    expect(limited.headers.get("Retry-After")).toBe("3");
    expect(limited.headers.get("RateLimit-Limit")).toBe("10");
    const running = answerRefusal(IdempotencyKeyInProgressError.create());
    expect(running.status).toBe(409);
    expect(running.headers.get("Retry-After")).toBe("1");
  });
});
