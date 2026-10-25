/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the service, the two drivers, the provider table, every provider's
 *          Integration and Connection, the refusals and the two helpers are its values, and nothing internal leaks.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as core from "#core/index";

describe("@stackra/payments", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(core).sort()).toEqual([
      "CapabilityUnsupportedError",
      "CheckoutConnection",
      "CheckoutIntegration",
      "CheckoutSandboxConnection",
      "CheckoutSandboxIntegration",
      "ConnectionPaymentGatewaysDriver",
      "FawryConnection",
      "FawryIntegration",
      "FawrySandboxConnection",
      "FawrySandboxIntegration",
      "HyperpayConnection",
      "HyperpayIntegration",
      "HyperpaySandboxConnection",
      "HyperpaySandboxIntegration",
      "InvalidPaymentTransitionError",
      "MemoryPaymentRecordsDriver",
      "MerchantInitiatedNotAllowedError",
      "MoyasarConnection",
      "MoyasarIntegration",
      "NoPaymentProviderError",
      "PAYMENT_CONNECTIONS",
      "PaymentDeclinedError",
      "PaymentFieldRequiredError",
      "PaymentService",
      "PaymentUnknownError",
      "PaymobConnection",
      "PaymobIntegration",
      "ResolutionReasonRequiredError",
      "StripeConnection",
      "StripeIntegration",
      "TabbyConnection",
      "TabbyIntegration",
      "TamaraConnection",
      "TamaraIntegration",
      "TamaraSandboxConnection",
      "TamaraSandboxIntegration",
      "hasCapability",
      "totalOf",
    ]);
  });
});
