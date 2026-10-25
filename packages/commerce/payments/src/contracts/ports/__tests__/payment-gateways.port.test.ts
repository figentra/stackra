/**
 * Stackra file contract:
 * Purpose: unit tests of `PaymentGateways`: an abstract port that answers a gateway for a Market and capabilities, or
 *          for a stored connection.
 * Boundary: test only; the type contract only, since the drivers have their own tests.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0356 (decision 2).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { PaymentCapability } from "#contracts/enums/payment-capability.enum";
import { PaymentGateways } from "#contracts/ports/payment-gateways.port";
import type { PaymentGateway } from "#contracts/types/payment-gateway.type";

describe("PaymentGateways", () => {
  it("is a port", () => {
    expect(Object.getPrototypeOf(PaymentGateways)).toBe(Port);
  });

  it("answers a gateway for a Market and its needs, or for a connection", () => {
    expectTypeOf<Parameters<PaymentGateways["forMarket"]>[1]>().toEqualTypeOf<
      readonly PaymentCapability[]
    >();
    expectTypeOf<ReturnType<PaymentGateways["byConnection"]>>().toEqualTypeOf<
      Promise<PaymentGateway>
    >();
  });
});
