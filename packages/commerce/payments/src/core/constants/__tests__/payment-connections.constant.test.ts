/**
 * Stackra file contract:
 * Purpose: unit tests of `PAYMENT_CONNECTIONS`: every key is its connection's provider code, and every connection
 *          declares the checkout capability the engine assumes.
 * Boundary: test only; each connection is built with `makeConnection` over an empty fake client.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0356 (decision 2).
 */
import { fakeIntegrationApi, makeConnection } from "@stackra/integrations/testing";
import { describe, expect, it } from "@stackra/testing";

import { PaymentCapability } from "#contracts/enums/payment-capability.enum";
import { PAYMENT_CONNECTIONS } from "#core/constants/payment-connections.constant";
import { StripeIntegration } from "#core/providers/stripe/stripe.integration";

describe("PAYMENT_CONNECTIONS", () => {
  it("keys each connection by its own provider code, all with checkout", () => {
    for (const [code, type] of Object.entries(PAYMENT_CONNECTIONS)) {
      const connection = makeConnection(type, {
        api: fakeIntegrationApi(StripeIntegration, () => undefined),
        fields: {} as never,
      });
      expect(connection.provider).toBe(code);
      expect(connection.capabilities).toContain(PaymentCapability.Checkout);
    }
  });
});
