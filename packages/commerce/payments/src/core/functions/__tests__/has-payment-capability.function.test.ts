/**
 * Stackra file contract:
 * Purpose: unit tests of `hasPaymentCapability`: true only for a capability the gateway lists.
 * Boundary: test only; the gateway fake stands in for a driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0357 (decision 2); STA-1383.
 */
import { describe, expect, it } from "@stackra/testing";

import { PaymentCapability } from "#contracts/enums/payment-capability.enum";
import { hasPaymentCapability } from "#core/functions/has-payment-capability.function";
import { PaymentGatewayFake } from "#testing/payment-gateway.fake";

describe("hasPaymentCapability", () => {
  it("is true only for a listed capability", () => {
    const gateway = PaymentGatewayFake.with({ capabilities: [PaymentCapability.Capture] });
    expect(hasPaymentCapability(gateway, PaymentCapability.Capture)).toBe(true);
    expect(hasPaymentCapability(gateway, PaymentCapability.Tokens)).toBe(false);
  });
});
