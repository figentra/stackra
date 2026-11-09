/**
 * Stackra file contract:
 * Purpose: unit tests of `hasCarrierCapability`: true only for a capability the gateway lists, and it narrows the type;
 *          a narrowed label gateway exposes the optional `findLabel` when the connector offers it.
 * Boundary: test only; a literal gateway stands in for a connector.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0369 (decision 2); STA-1383.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { CarrierCapability } from "#contracts/enums/carrier-capability.enum";
import type { CarrierGateway } from "#contracts/types/carrier-gateway.type";
import type { LabelGateway } from "#contracts/types/label-gateway.type";
import type { PickupGateway } from "#contracts/types/pickup-gateway.type";
import { hasCarrierCapability } from "#core/functions/has-carrier-capability.function";

const gateway: CarrierGateway = {
  id: "con_1",
  provider: "carrier_a",
  capabilities: [CarrierCapability.Pickups],
};

describe("hasCarrierCapability", () => {
  it("is true only for a listed capability", () => {
    expect(hasCarrierCapability(gateway, CarrierCapability.Pickups)).toBe(true);
    expect(hasCarrierCapability(gateway, CarrierCapability.Labels)).toBe(false);
  });

  it("narrows to the capability's interface", () => {
    if (hasCarrierCapability(gateway, CarrierCapability.Pickups))
      expectTypeOf(gateway).toMatchTypeOf<PickupGateway>();
  });

  it("finds a booked label by reference only where the connector offers it", async () => {
    const booked = { shipmentId: "shp_1", trackingNumbers: ["T1"], service: "std", labels: [] };
    const labels: CarrierGateway & LabelGateway = {
      id: "con_2",
      provider: "carrier_b",
      capabilities: [CarrierCapability.Labels],
      createLabel: async () => booked,
      cancel: async () => undefined,
      findLabel: async (reference) => (reference === "ref_1" ? booked : null),
    };
    const plain: CarrierGateway & LabelGateway = {
      id: "con_3",
      provider: "carrier_c",
      capabilities: [CarrierCapability.Labels],
      createLabel: async () => booked,
      cancel: async () => undefined,
    };

    expect(hasCarrierCapability(labels, CarrierCapability.Labels)).toBe(true);
    expect(await labels.findLabel?.("ref_1")).toEqual(booked);
    expect(await labels.findLabel?.("ref_2")).toBeNull();
    expect(plain.findLabel).toBeUndefined();
  });
});
