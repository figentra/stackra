/**
 * Stackra file contract:
 * Purpose: unit tests of `CarrierGateways`: an abstract port that answers one gateway for a Market and capabilities,
 *          every such gateway, or the gateway of a stored connection.
 * Boundary: test only; the type contract and a literal driver, since the real driver lives in OS integrations.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0356 (decision 2); ADR 0369 (decision 3).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { CarrierCapability } from "#contracts/enums/carrier-capability.enum";
import { CarrierGateways } from "#contracts/ports/carrier-gateways.port";
import type { CarrierGateway } from "#contracts/types/carrier-gateway.type";

const gateway: CarrierGateway = {
  id: "con_1",
  provider: "carrier_a",
  capabilities: [CarrierCapability.Rates],
};

class LiteralCarrierGateways extends CarrierGateways {
  async forMarket(): Promise<CarrierGateway> {
    return gateway;
  }

  async allForMarket(): Promise<readonly CarrierGateway[]> {
    return [gateway];
  }

  async byConnection(): Promise<CarrierGateway> {
    return gateway;
  }
}

describe("CarrierGateways", () => {
  it("is a port", () => {
    expect(Object.getPrototypeOf(CarrierGateways)).toBe(Port);
  });

  it("takes a Market and the needed capabilities", () => {
    expectTypeOf<Parameters<CarrierGateways["forMarket"]>[1]>().toEqualTypeOf<
      readonly CarrierCapability[]
    >();
    expectTypeOf<ReturnType<CarrierGateways["allForMarket"]>>().toEqualTypeOf<
      Promise<readonly CarrierGateway[]>
    >();
    expectTypeOf<ReturnType<CarrierGateways["byConnection"]>>().toEqualTypeOf<
      Promise<CarrierGateway>
    >();
  });

  it("is implemented by a driver subclass", async () => {
    const carriers = new LiteralCarrierGateways();
    expect(await carriers.forMarket("zz", [CarrierCapability.Rates])).toBe(gateway);
    expect(await carriers.allForMarket("zz", [])).toEqual([gateway]);
    expect(await carriers.byConnection("carrier_a", "con_1")).toBe(gateway);
  });
});
