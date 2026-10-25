/**
 * Stackra file contract:
 * Purpose: unit tests of `PairingState`: pending, paired or expired.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0361 (decision 7).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { PairingState } from "#contracts/enums/pairing-state.enum";

describe("PairingState", () => {
  it("is pending, paired or expired", () => {
    expect(Enum.values(PairingState)).toEqual(["pending", "paired", "expired"]);
  });
});
