/**
 * Stackra file contract:
 * Purpose: unit tests of `PickupPointKind`: its snake_case codes, in order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0231; ADR 0369 (open question 1).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { PickupPointKind } from "#contracts/enums/pickup-point-kind.enum";

describe("PickupPointKind", () => {
  it("has its snake_case codes in order", () => {
    expect(Enum.values(PickupPointKind)).toEqual(["locker", "counter"]);
  });
});
