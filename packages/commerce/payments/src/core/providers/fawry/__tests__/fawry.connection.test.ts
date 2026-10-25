/**
 * Stackra file contract:
 * Purpose: unit tests of `FawryConnection`: a checkout is signed over Fawry's field order and returns the page URL;
 *          the status lookup is signed and maps the order state, and an unknown order is nothing; a refund is signed
 *          and a body refusal is `ProviderRefusedError`.
 * Boundary: test only; the managed client is `fakeIntegrationApi`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0357 (decisions 2 and 6).
 */
import { refusal } from "@stackra/errors/testing";
import { ProviderRefusedError } from "@stackra/integrations";
import { fakeIntegrationApi, makeConnection } from "@stackra/integrations/testing";
import type { FakeIntegrationRoutes } from "@stackra/integrations/testing";
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import { PaymentStatus } from "#contracts/enums/payment-status.enum";
import { sha256Hex } from "#core/functions/sha256-hex.function";
import { FawryConnection } from "#core/providers/fawry/fawry.connection";
import { FawryIntegration } from "#core/providers/fawry/fawry.integration";

const amount = Money.ofMinor(25_000, "EGP");
const connect = (routes: (r: FakeIntegrationRoutes) => unknown) =>
  makeConnection(FawryConnection, {
    api: fakeIntegrationApi(FawryIntegration, routes),
    fields: { merchantCode: "MC", secureKey: "KEY", currency: "EGP" },
  });

describe("FawryConnection", () => {
  it("signs the checkout and returns the page", async () => {
    let sent: { signature?: string } = {};
    const fawry = connect((r) =>
      r.post("/fawrypay-api/api/payments/init").returns((_p, { body }) => {
        sent = body as { signature: string };
        return "https://atfawry.com/pay/x";
      }),
    );
    const session = await fawry.checkout({
      reference: "ord_1",
      amount,
      description: "Order 1",
      returnUrl: "https://shop.example/ok",
      cancelUrl: "https://shop.example/no",
    });
    expect(session).toMatchObject({ providerRef: "ord_1", url: "https://atfawry.com/pay/x" });
    expect(sent.signature).toBe(await sha256Hex("MCord_1https://shop.example/okord_11250.00KEY"));
  });

  it("maps a signed status and finds nothing for an unknown order", async () => {
    let query: Readonly<Record<string, unknown>> = {};
    const fawry = connect((r) =>
      r.get("/ECommerceWeb/Fawry/payments/status/v2").returns((_p, request) => {
        query = request.query;
        return request.query.merchantRefNumber === "ord_1"
          ? { statusCode: 200, referenceNumber: "F123", orderAmount: 250, orderStatus: "PAID" }
          : { statusCode: 9938 };
      }),
    );
    expect(await fawry.lookup({ reference: "ord_1" })).toMatchObject({
      providerRef: "F123",
      status: PaymentStatus.Captured,
    });
    expect(query.signature).toBe(await sha256Hex("MCord_1KEY"));
    expect(await fawry.lookup({ reference: "ord_9" })).toBeNull();
  });

  it("signs a refund and raises a body refusal", async () => {
    let code = 200;
    const fawry = connect((r) =>
      r
        .get("/ECommerceWeb/Fawry/payments/status/v2")
        .returns(() => ({
          statusCode: 200,
          referenceNumber: "F123",
          orderAmount: 250,
          orderStatus: "PAID",
        }))
        .post("/ECommerceWeb/Fawry/payments/refund")
        .returns(() => ({ statusCode: code })),
    );
    const request = {
      payment: { reference: "ord_1" },
      amount,
      reference: "r1",
      reason: "returned",
    };
    expect((await fawry.refund(request)).status).toBe("succeeded");
    code = 9901;
    await expect(fawry.refund(request)).rejects.toRefuseWith(
      refusal(ProviderRefusedError, { provider: "fawry", status: 422 }),
    );
  });
});
