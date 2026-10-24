/**
 * Stackra file contract:
 * Purpose: unit tests of `UnresolvedPortError`: a plain `Error` (not a refusal) that names the port and the reason.
 * Boundary: test only; when the container throws it is proven in the container's tests.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0263 (consequences).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { UnresolvedPortError } from "#core/errors/unresolved-port.error";

abstract class LoyaltyMembers extends Port {}

describe("UnresolvedPortError", () => {
  it("is a plain Error naming the port and the reason", () => {
    const error = new UnresolvedPortError(LoyaltyMembers, "it has no candidate");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("UnresolvedPortError");
    expect(error.port).toBe(LoyaltyMembers);
    expect(error.message).toBe("No driver is bound to LoyaltyMembers: it has no candidate");
    expect("code" in error).toBe(false);
  });
});
