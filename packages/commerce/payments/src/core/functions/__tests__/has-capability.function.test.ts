/**
 * Stackra file contract:
 * Purpose: unit tests of `hasCapability`: true only for a capability the gateway lists.
 * Boundary: test only; the gateway fake stands in for a driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0357 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { PaymentCapability } from "#contracts/enums/payment-capability.enum";
import { hasCapability } from "#core/functions/has-capability.function";
import { PaymentGatewayFake } from "#testing/payment-gateway.fake";

describe("hasCapability", () => {
  it("is true only for a listed capability", () => {
    const gateway = PaymentGatewayFake.with({ capabilities: [PaymentCapability.Capture] });
    expect(hasCapability(gateway, PaymentCapability.Capture)).toBe(true);
    expect(hasCapability(gateway, PaymentCapability.Tokens)).toBe(false);
  });
});
