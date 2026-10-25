/**
 * Stackra file contract:
 * Purpose: unit tests of `TamaraConnection`: a checkout needs the buyer's address, phone and name and sends the
 *          connection's payment type; a lookup by reference treats 404 as nothing; a capture authorises an approved
 *          order first; void and refund go to the order.
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
import { TamaraConnection } from "#core/providers/tamara/tamara.connection";
import { TamaraIntegration } from "#core/providers/tamara/tamara.integration";

const amount = Money.ofMinor(30_000, "SAR");
const customer = {
  name: "Sara Ali",
  phone: "+966500000001",
  address: { line1: "1 Road", city: "Riyadh", country: "SA" },
};
const request = {
  reference: "ord_1",
  amount,
  description: "Order 1",
  returnUrl: "https://shop.example/ok",
  cancelUrl: "https://shop.example/no",
};

const connect = (routes: (r: FakeIntegrationRoutes) => unknown) =>
  makeConnection(TamaraConnection, {
    api: fakeIntegrationApi(TamaraIntegration, routes),
    fields: { apiToken: "token", paymentType: "PAY_BY_INSTALMENTS", instalments: 3 },
  });

describe("TamaraConnection", () => {
  it("refuses a checkout without an address", async () => {
    await expect(connect(() => undefined).checkout(request)).rejects.toRefuseWith(
      refusal(PaymentFieldRequiredError, { provider: "tamara", field: "customer.address" }),
    );
  });

  it("opens a checkout with the connection's payment type", async () => {
    let sent: unknown;
    const tamara = connect((r) =>
      r.post("/checkout").returns((_p, { body }) => {
        sent = body;
        return {
          order_id: "o_1",
          checkout_id: "c_1",
          checkout_url: "https://checkout.tamara.co/x",
        };
      }),
    );
    expect(await tamara.checkout({ ...request, customer })).toEqual({
      providerRef: "o_1",
      kind: "redirect",
      url: "https://checkout.tamara.co/x",
    });
    expect(sent).toMatchObject({
      payment_type: "PAY_BY_INSTALMENTS",
      instalments: 3,
      total_amount: { amount: 300, currency: "SAR" },
      consumer: { first_name: "Sara", last_name: "Ali" },
      shipping_address: { country_code: "SA" },
    });
  });

  it("finds nothing for an unknown reference", async () => {
    const tamara = connect((r) =>
      r.get("/merchants/orders/reference-id/:ref").returns(() => {
        throw ProviderRefusedError.create({ provider: "tamara", status: 404 });
      }),
    );
    expect(await tamara.lookup({ reference: "ord_9" })).toBeNull();
  });

  it("authorises an approved order before capturing it, then voids and refunds by order", async () => {
    const calls: string[] = [];
    let status = "approved";
    const tamara = connect((r) =>
      r
        .get("/orders/:id")
        .returns(() => ({
          order_id: "o_1",
          status,
          total_amount: { amount: 300, currency: "SAR" },
        }))
        .post("/orders/:id/authorise")
        .returns(() => {
          calls.push("authorise");
          status = "authorised";
          return {};
        })
        .post("/payments/capture")
        .returns(() => {
          calls.push("capture");
          status = "fully_captured";
          return {};
        })
        .post("/orders/:id/cancel")
        .returns(() => ({ cancel_id: "x" }))
        .post("/payments/simplified-refund/:id")
        .returns(() => ({ refund_id: "rf_1" })),
    );
    const target = { reference: "ord_1", providerRef: "o_1" };
    expect((await tamara.capture({ payment: target, amount, reference: "c1" })).status).toBe(
      PaymentStatus.Captured,
    );
    expect(calls).toEqual(["authorise", "capture"]);
    expect((await tamara.void(target)).status).toBe(PaymentStatus.Voided);
    expect((await tamara.refund({ payment: target, amount, reference: "r1" })).providerRef).toBe(
      "rf_1",
    );
  });
});
