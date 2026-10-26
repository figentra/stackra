/**
 * Stackra file contract:
 * Purpose: unit tests of `ConnectionMode`: the three fixed modes keep the owner's spelling, in order.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; R4-6.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ConnectionMode } from "#contracts/enums/connection-mode.enum";

describe("ConnectionMode", () => {
  it("holds the three fixed modes", () => {
    expect(Enum.values(ConnectionMode)).toEqual(["oauth-standard", "own-key", "connected-account"]);
  });
});
