/**
 * Stackra file contract:
 * Purpose: unit tests of `PaymobOmanConnection`: the Paymob driver under the `paymob-oman` provider code, with its
 *          Unified Checkout page on oman.paymob.com.
 * Boundary: test only; the managed client is `fakeIntegrationApi`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0308 (rule 2); spec task T012.
 */
import { fakeIntegrationApi, makeConnection } from "@stackra/integrations/testing";
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import { PaymobOmanConnection } from "#core/providers/paymob/paymob-oman.connection";
import { PaymobOmanIntegration } from "#core/providers/paymob/paymob-oman.integration";

describe("PaymobOmanConnection", () => {
  it("opens its checkout on the regional host under its own provider code", async () => {
    const paymob = makeConnection(PaymobOmanConnection, {
      api: fakeIntegrationApi(PaymobOmanIntegration, (r) =>
        r.post("/v1/intention").returns(() => ({ id: "pi_1", client_secret: "cs_1" })),
      ),
      fields: { secretKey: "sk", publicKey: "pk_1", integrationIds: [11] },
    });
    expect(paymob.provider).toBe("paymob-oman");
    const session = await paymob.checkout({
      reference: "ord_1",
      amount: Money.ofMinor(10_000, "OMR"),
      description: "Order 1",
      returnUrl: "https://shop.example/ok",
      cancelUrl: "https://shop.example/no",
      customer: { name: "Sara Ali", email: "sara@example.com", phone: "+10000000000" },
    });
    expect(session.url).toBe(
      "https://oman.paymob.com/unifiedcheckout/?publicKey=pk_1&clientSecret=cs_1",
    );
  });
});
