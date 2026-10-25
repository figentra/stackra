/**
 * Stackra file contract:
 * Purpose: unit tests of `MoyasarConnection`: the Basic credential is the key with an empty password; a checkout is
 *          an invoice for amount plus tip; an invoice's payment answers the lookup and takes the capture; a partial
 *          refund maps; a merchant-initiated token charge skips 3-D Secure.
 * Boundary: test only; the managed client is `fakeIntegrationApi`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0357 (decisions 2, 5 and 6).
 */
import { fakeIntegrationApi, makeConnection } from "@stackra/integrations/testing";
import type { FakeIntegrationRoutes } from "@stackra/integrations/testing";
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import { ChargeInitiator } from "#contracts/enums/charge-initiator.enum";
import { PaymentStatus } from "#contracts/enums/payment-status.enum";
import { MoyasarConnection } from "#core/providers/moyasar/moyasar.connection";
import { MoyasarIntegration } from "#core/providers/moyasar/moyasar.integration";

const amount = Money.ofMinor(10_000, "SAR");
const payment = {
  id: "pay-uuid",
  status: "authorized",
  amount: 10_000,
  refunded: 0,
  currency: "SAR",
};

const connect = (routes: (r: FakeIntegrationRoutes) => unknown) =>
  makeConnection(MoyasarConnection, {
    api: fakeIntegrationApi(MoyasarIntegration, routes),
    fields: { secretKey: "sk_test_x", callbackUrl: "https://shop.example/3ds" },
  });

describe("MoyasarConnection", () => {
  it("derives the Basic credential from the key", () => {
    expect(connect(() => undefined).basicCredential).toBe(btoa("sk_test_x:"));
  });

  it("opens an invoice for amount plus tip", async () => {
    let sent: unknown;
    const moyasar = connect((r) =>
      r.post("/v1/invoices").returns((_p, { body }) => {
        sent = body;
        return {
          id: "inv-uuid",
          status: "initiated",
          amount: 10_500,
          currency: "SAR",
          url: "https://checkout.moyasar.com/invoices/inv-uuid",
        };
      }),
    );
    const session = await moyasar.checkout({
      reference: "ord_1",
      amount,
      tip: Money.ofMinor(500, "SAR"),
      description: "Order 1",
      returnUrl: "https://shop.example/ok",
      cancelUrl: "https://shop.example/no",
    });
    expect(session).toMatchObject({ providerRef: "invoice:inv-uuid", kind: "redirect" });
    expect(sent).toMatchObject({
      amount: 10_500,
      currency: "SAR",
      metadata: { reference: "ord_1" },
    });
  });

  it("reads the invoice's payment and captures it", async () => {
    const moyasar = connect((r) =>
      r
        .get("/v1/invoices/:id")
        .returns(() => ({
          id: "inv-uuid",
          status: "paid",
          amount: 10_000,
          currency: "SAR",
          url: "u",
          payments: [payment],
        }))
        .post("/v1/payments/:id/capture")
        .returns(() => ({ ...payment, status: "captured" })),
    );
    expect(
      await moyasar.lookup({ reference: "ord_1", providerRef: "invoice:inv-uuid" }),
    ).toMatchObject({
      providerRef: "pay-uuid",
      status: PaymentStatus.Authorized,
    });
    const captured = await moyasar.capture({
      payment: { reference: "ord_1", providerRef: "invoice:inv-uuid" },
      amount,
      reference: "c1",
    });
    expect(captured.status).toBe(PaymentStatus.Captured);
  });

  it("maps a partial refund", async () => {
    const moyasar = connect((r) =>
      r
        .get("/v1/payments/:id")
        .returns(() => ({ ...payment, status: "refunded", refunded: 4_000 })),
    );
    expect((await moyasar.lookup({ reference: "ord_1", providerRef: "pay-uuid" }))?.status).toBe(
      PaymentStatus.PartiallyRefunded,
    );
  });

  it("charges a token without 3-D Secure when the merchant starts it", async () => {
    let sent: unknown;
    const moyasar = connect((r) =>
      r.post("/v1/payments").returns((_p, { body }) => {
        sent = body;
        return { ...payment, status: "paid" };
      }),
    );
    await moyasar.charge({
      reference: "inv_7",
      amount,
      initiator: ChargeInitiator.Merchant,
      method: {
        provider: "moyasar",
        connectionId: "conn_1",
        token: "token_1",
        merchantInitiated: true,
      },
    });
    expect(sent).toMatchObject({
      source: { type: "token", token: "token_1", "3ds": false },
      callback_url: "https://shop.example/3ds",
    });
  });
});
