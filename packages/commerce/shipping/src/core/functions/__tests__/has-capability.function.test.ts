/**
 * Stackra file contract:
 * Purpose: unit tests of `hasCapability`: true only for a capability the gateway lists, and it narrows the type.
 * Boundary: test only; a literal gateway stands in for a connector.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0369 (decision 2).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { CarrierCapability } from "#contracts/enums/carrier-capability.enum";
import type { CarrierGateway } from "#contracts/types/carrier-gateway.type";
import type { PickupGateway } from "#contracts/types/pickup-gateway.type";
import { hasCapability } from "#core/functions/has-capability.function";

const gateway: CarrierGateway = {
  id: "con_1",
  provider: "carrier_a",
  capabilities: [CarrierCapability.Pickups],
};

describe("hasCapability", () => {
  it("is true only for a listed capability", () => {
    expect(hasCapability(gateway, CarrierCapability.Pickups)).toBe(true);
    expect(hasCapability(gateway, CarrierCapability.Labels)).toBe(false);
  });

  it("narrows to the capability's interface", () => {
    if (hasCapability(gateway, CarrierCapability.Pickups))
      expectTypeOf(gateway).toMatchTypeOf<PickupGateway>();
  });
});
