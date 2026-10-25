/**
 * Stackra file contract:
 * Purpose: unit tests of `SessionStatus`: loading, signed in, signed out and revoked, in that order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 16); ADR 0338 (decision 4).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { SessionStatus } from "#core/enums/session-status.enum";

describe("SessionStatus", () => {
  it("lists the statuses in order", () => {
    expect(Enum.values(SessionStatus)).toEqual(["loading", "signed_in", "signed_out", "revoked"]);
    expectTypeOf<SessionStatus>().toEqualTypeOf<
      "loading" | "signed_in" | "signed_out" | "revoked"
    >();
  });
});
