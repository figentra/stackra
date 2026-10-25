/**
 * Stackra file contract:
 * Purpose: unit tests of `CheckoutSandboxConnection`: the Checkout.com driver under the sandbox provider code.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0359 (decision 11).
 */
import { fakeIntegrationApi, makeConnection } from "@stackra/integrations/testing";
import { describe, expect, it } from "@stackra/testing";

import { CheckoutConnection } from "#core/providers/checkout/checkout.connection";
import { CheckoutSandboxConnection } from "#core/providers/checkout/checkout-sandbox.connection";
import { CheckoutSandboxIntegration } from "#core/providers/checkout/checkout-sandbox.integration";

describe("CheckoutSandboxConnection", () => {
  it("is the Checkout.com driver under the sandbox code", () => {
    const sandbox = makeConnection(CheckoutSandboxConnection, {
      api: fakeIntegrationApi(CheckoutSandboxIntegration, () => undefined),
      fields: { secretKey: "sk_sbox_x", processingChannelId: "pc_1" },
    });
    expect(sandbox).toBeInstanceOf(CheckoutConnection);
    expect(sandbox.provider).toBe("checkout-sandbox");
  });
});
