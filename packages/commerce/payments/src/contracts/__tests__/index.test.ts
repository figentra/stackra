/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: exactly the eight enums and the eleven container ports are
 *          its values; the gateway port interfaces and the payment types are type-only.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type {
  PaymentCapabilityGateways,
  IncrementalAuthGateway,
  MethodsGateway,
  PaymentConnectionMode,
  PaymentGateway,
  PreAuthGateway,
  TerminalGateway,
  TokenGateway,
} from "#contracts/index";

describe("@stackra/payments/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "AgentCommerceProtocols",
      "ChargeInitiator",
      "ConnectedAccountLimits",
      "ConnectionMode",
      "DisputeStatus",
      "EcrOutcome",
      "MarketPaymentDefaults",
      "PaymentBalances",
      "PaymentCapability",
      "PaymentGateways",
      "PaymentPackSource",
      "PaymentRecords",
      "PaymentStatus",
      "RestrictedTenderPrograms",
      "SessionKind",
      "SoftPos",
      "StripeTerminalBridge",
      "TenderEligibility",
      "TenderKind",
      "TransferStatus",
    ]);
  });

  it("maps each capability to its port", () => {
    expectTypeOf<PaymentCapabilityGateways["tokens"]>().toEqualTypeOf<TokenGateway>();
    expectTypeOf<PaymentCapabilityGateways["methods"]>().toEqualTypeOf<MethodsGateway>();
    expectTypeOf<PaymentCapabilityGateways["restricted_tender"]>().toEqualTypeOf<PaymentGateway>();
    expectTypeOf<PaymentCapabilityGateways["terminal_pin"]>().toEqualTypeOf<TerminalGateway>();
    expectTypeOf<PaymentCapabilityGateways["soft_pos"]>().toEqualTypeOf<TerminalGateway>();
    expectTypeOf<PaymentCapabilityGateways["pre_auth"]>().toEqualTypeOf<PreAuthGateway>();
    expectTypeOf<
      PaymentCapabilityGateways["incremental_auth"]
    >().toEqualTypeOf<IncrementalAuthGateway>();
  });

  it("types the four connection modes", () => {
    expectTypeOf<"legacy-connected-account:academorix">().toExtend<PaymentConnectionMode>();
    expectTypeOf<"own-key">().toExtend<PaymentConnectionMode>();
  });
});
