/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: exactly the six enums and the three container ports are
 *          its values; the gateway port interfaces and the payment types are type-only.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type { CapabilityGateways, TokenGateway } from "#contracts/index";

describe("@stackra/payments/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "ChargeInitiator",
      "DisputeStatus",
      "MarketPaymentDefaults",
      "PaymentCapability",
      "PaymentGateways",
      "PaymentRecords",
      "PaymentStatus",
      "SessionKind",
      "TransferStatus",
    ]);
  });

  it("maps each capability to its port", () => {
    expectTypeOf<CapabilityGateways["tokens"]>().toEqualTypeOf<TokenGateway>();
  });
});
