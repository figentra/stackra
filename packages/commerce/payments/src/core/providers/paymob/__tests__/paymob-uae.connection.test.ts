/**
 * Stackra file contract:
 * Purpose: unit tests of `PaymobUaeConnection`: the Paymob driver under the `paymob-uae` provider code, with its
 *          Unified Checkout page on uae.paymob.com.
 * Boundary: test only; the managed client is `fakeIntegrationApi`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0308 (rule 2); spec task T012.
 */
import { fakeIntegrationApi, makeConnection } from "@stackra/integrations/testing";
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import { PaymobUaeConnection } from "#core/providers/paymob/paymob-uae.connection";
import { PaymobUaeIntegration } from "#core/providers/paymob/paymob-uae.integration";

describe("PaymobUaeConnection", () => {
  it("opens its checkout on the regional host under its own provider code", async () => {
    const paymob = makeConnection(PaymobUaeConnection, {
      api: fakeIntegrationApi(PaymobUaeIntegration, (r) =>
        r.post("/v1/intention").returns(() => ({ id: "pi_1", client_secret: "cs_1" })),
      ),
      fields: { secretKey: "sk", publicKey: "pk_1", integrationIds: [11] },
    });
    expect(paymob.provider).toBe("paymob-uae");
    const session = await paymob.checkout({
      reference: "ord_1",
      amount: Money.ofMinor(10_000, "AED"),
      description: "Order 1",
      returnUrl: "https://shop.example/ok",
      cancelUrl: "https://shop.example/no",
      customer: { name: "Sara Ali", email: "sara@example.com", phone: "+10000000000" },
    });
    expect(session.url).toBe(
      "https://uae.paymob.com/unifiedcheckout/?publicKey=pk_1&clientSecret=cs_1",
    );
  });
});
