/**
 * Stackra file contract:
 * Purpose: unit tests of `PaymobConnection`: a checkout needs the buyer's billing data, opens an Intention for the
 *          connection's integrations and returns the Unified Checkout URL; the inquiry maps an authorised and a
 *          partly refunded transaction, and 404 is nothing; capture and refund use the transaction id.
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
import { PaymentFieldRequiredError } from "#core/errors/payment-field-required.error";
import { PaymobConnection } from "#core/providers/paymob/paymob.connection";
import { PaymobIntegration } from "#core/providers/paymob/paymob.integration";

const amount = Money.ofMinor(50_000, "EGP");
const request = {
  reference: "ord_1",
  amount,
  description: "Order 1",
  returnUrl: "https://shop.example/ok",
  cancelUrl: "https://shop.example/no",
  customer: { name: "Omar Said", email: "omar@example.com", phone: "+201000000000" },
};
const transaction = {
  id: 777,
  success: true,
  pending: false,
  amount_cents: 50_000,
  currency: "EGP",
};

const connect = (routes: (r: FakeIntegrationRoutes) => unknown) =>
  makeConnection(PaymobConnection, {
    api: fakeIntegrationApi(PaymobIntegration, routes),
    fields: { secretKey: "sk", publicKey: "pk_1", integrationIds: [11, 12] },
  });

describe("PaymobConnection", () => {
  it("refuses a checkout without billing data", async () => {
    await expect(
      connect(() => undefined).checkout({ ...request, customer: {} }),
    ).rejects.toRefuseWith(
      refusal(PaymentFieldRequiredError, { provider: "paymob", field: "customer.name" }),
    );
  });

  it("opens an Intention and returns the Unified Checkout URL", async () => {
    let sent: unknown;
    const paymob = connect((r) =>
      r.post("/v1/intention").returns((_p, { body }) => {
        sent = body;
        return { id: "pi_1", client_secret: "cs_1" };
      }),
    );
    const session = await paymob.checkout(request);
    expect(session.providerRef).toBe("pi_1");
    expect(session.url).toBe(
      "https://accept.paymob.com/unifiedcheckout/?publicKey=pk_1&clientSecret=cs_1",
    );
    expect(sent).toMatchObject({
      amount: 50_000,
      currency: "EGP",
      payment_methods: [11, 12],
      special_reference: "ord_1",
    });
  });

  it("maps the inquiry, and 404 is nothing", async () => {
    let answer: object = { ...transaction, is_auth: true, captured_amount: 0 };
    const paymob = connect((r) =>
      r.post("/api/ecommerce/orders/transaction_inquiry").returns((_p, { body }) => {
        if ((body as { merchant_order_id: string }).merchant_order_id === "none")
          throw ProviderRefusedError.create({ provider: "paymob", status: 404 });
        return answer;
      }),
    );
    expect(await paymob.lookup({ reference: "ord_1" })).toMatchObject({
      providerRef: "777",
      status: PaymentStatus.Authorized,
    });
    answer = { ...transaction, refunded_amount_cents: 10_000 };
    expect((await paymob.lookup({ reference: "ord_1" }))?.status).toBe(
      PaymentStatus.PartiallyRefunded,
    );
    expect(await paymob.lookup({ reference: "none" })).toBeNull();
  });

  it("captures and refunds by transaction id", async () => {
    const sent: unknown[] = [];
    const paymob = connect((r) =>
      r
        .post("/api/acceptance/capture")
        .returns((_p, { body }) => {
          sent.push(body);
          return { ...transaction, is_auth: true, captured_amount: 50_000 };
        })
        .post("/api/acceptance/void_refund/refund")
        .returns((_p, { body }) => {
          sent.push(body);
          return { ...transaction, id: 778 };
        }),
    );
    const target = { reference: "ord_1", providerRef: "777" };
    expect((await paymob.capture({ payment: target, amount, reference: "c1" })).status).toBe(
      PaymentStatus.Captured,
    );
    expect(await paymob.refund({ payment: target, amount, reference: "r1" })).toEqual({
      providerRef: "778",
      status: "succeeded",
    });
    expect(sent).toEqual([
      { transaction_id: 777, amount_cents: 50_000 },
      { transaction_id: 777, amount_cents: 50_000 },
    ]);
  });
});
