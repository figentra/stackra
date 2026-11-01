/**
 * Stackra file contract:
 * Purpose: unit tests of `UnboundTokenError`: a plain `Error` (not a refusal) that names the class nothing binds.
 * Boundary: test only; when the container throws it is proven in the container's tests.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0263 (consequences).
 */
import { describe, expect, it } from "@stackra/testing";

import { UnboundTokenError } from "#core/errors/unbound-token.error";

class QueueService {}

describe("UnboundTokenError", () => {
  it("is a plain Error naming the class nothing binds", () => {
    const error = new UnboundTokenError(QueueService);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("UnboundTokenError");
    expect(error.token).toBe(QueueService);
    expect(error.message).toBe(
      "Nothing binds QueueService: it is not in the wiring, not exported by a booted module and not overridden " +
        "(in a test, run `stackra gen` first: its setup registers the member's wiring)",
    );
    expect("code" in error).toBe(false);
  });
});
