/**
 * Stackra file contract:
 * Purpose: unit tests of `CarrierGatewaysFake`: it is the port, picks per Market by capability in offer order, finds a
 *          connection, records each call and refuses with `NoCarrierError` where a driver would.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0369 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { CarrierCapability } from "#contracts/enums/carrier-capability.enum";
import { CarrierGateways } from "#contracts/ports/carrier-gateways.port";
import type { CarrierGateway } from "#contracts/types/carrier-gateway.type";
import { NoCarrierError } from "#core/errors/no-carrier.error";
import { CarrierGatewaysFake } from "#testing/carrier-gateways.fake";

const rates: CarrierGateway = {
  id: "con_1",
  provider: "carrier_a",
  capabilities: [CarrierCapability.Rates],
};
const full: CarrierGateway = {
  id: "con_2",
  provider: "carrier_b",
  capabilities: [CarrierCapability.Rates, CarrierCapability.Labels, CarrierCapability.PickupPoints],
};

/** A fake offering both gateways in Market `zz`, rates-only first. */
const offering = (): CarrierGatewaysFake => {
  const carriers = new CarrierGatewaysFake();
  carriers.offers.push({ market: "zz", gateway: rates }, { market: "zz", gateway: full });
  return carriers;
};

describe("CarrierGatewaysFake", () => {
  it("is a CarrierGateways", () => {
    expect(new CarrierGatewaysFake()).toBeInstanceOf(CarrierGateways);
  });

  it("picks the first offer with every needed capability", async () => {
    const carriers = offering();
    expect(await carriers.forMarket("zz", [CarrierCapability.Rates])).toBe(rates);
    expect(
      await carriers.forMarket("zz", [CarrierCapability.Labels, CarrierCapability.PickupPoints]),
    ).toBe(full);
    expect(await carriers.allForMarket("zz", [CarrierCapability.Rates])).toEqual([rates, full]);
    expect(await carriers.allForMarket("yy", [])).toEqual([]);
    expect(carriers.calls("forMarket")).toEqual(["zz", "zz"]);
  });

  it("finds the connection that bought a label", async () => {
    expect(await offering().byConnection("carrier_b", "con_2")).toBe(full);
  });

  it("refuses with NoCarrierError where a driver would", async () => {
    const carriers = offering();
    await expect(carriers.forMarket("zz", [CarrierCapability.Returns])).rejects.toBeInstanceOf(
      NoCarrierError,
    );
    await expect(carriers.forMarket("yy", [])).rejects.toMatchObject({ market: "yy" });
    await expect(carriers.byConnection("carrier_a", "con_9")).rejects.toMatchObject({
      provider: "carrier_a",
    });
  });
});
