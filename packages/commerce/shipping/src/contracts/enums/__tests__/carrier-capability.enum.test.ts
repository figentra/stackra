/**
 * Stackra file contract:
 * Purpose: unit tests of `CarrierCapability`: its snake_case codes, in order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0231; ADR 0369.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { CarrierCapability } from "#contracts/enums/carrier-capability.enum";

describe("CarrierCapability", () => {
  it("has its snake_case codes in order", () => {
    expect(Enum.values(CarrierCapability)).toEqual(["rates", "labels", "pickups", "tracking"]);
  });
});
