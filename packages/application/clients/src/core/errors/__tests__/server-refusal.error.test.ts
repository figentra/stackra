/**
 * Stackra file contract:
 * Purpose: unit tests of `ServerRefusalError`: without an envelope it is an internal refusal coded `server_refusal`;
 *          decoded, it reports the envelope's code, kind and `retryable`, so `isRefusal` against a ref of that code
 *          still matches.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140 (envelope and kinds).
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ServerRefusalError } from "#core/errors/server-refusal.error";
import { decodeRefusal } from "#core/functions/decode-refusal.function";
import { refusalRef } from "#core/functions/refusal-ref.function";

describe("ServerRefusalError", () => {
  it("is an internal refusal coded server_refusal on its own", () => {
    const error = ServerRefusalError.create();
    expect(error.code).toBe("server_refusal");
    expect(error.kind).toBe(ErrorKind.Internal);
    expect(error.retryable).toBe(false);
  });

  it("reports the envelope it was decoded from", () => {
    const error = decodeRefusal({
      code: "rate_limited",
      category: "rate_limited",
      retryable: true,
    });
    expect(error).toBeInstanceOf(ServerRefusalError);
    expect(error.code).toBe("rate_limited");
    expect(error.kind).toBe(ErrorKind.RateLimited);
    expect(error.retryable).toBe(true);
  });

  it("matches a ref of the same code loaded later", () => {
    const error = decodeRefusal({
      code: "orders_paused",
      category: "precondition_failed",
      retryable: false,
    });
    class OrdersPausedError extends refusalRef("orders.orders_paused") {}
    expect(isRefusal(error, OrdersPausedError)).toBe(true);
  });
});
