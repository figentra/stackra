/**
 * Stackra file contract:
 * Purpose: unit tests of `CheckoutConnection`: a checkout needs the billing country, opens a hosted page (or a
 *          payment link with an expiry) for amount plus tip; a lookup by reference maps the state; capture, void and
 *          refund go to the payment's id; a dispute maps its state.
 * Boundary: test only; the managed client is `fakeIntegrationApi`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0357 (decisions 2 and 6).
 */
import { refusal } from "@stackra/errors/testing";
import { fakeIntegrationApi, makeConnection } from "@stackra/integrations/testing";
import type { FakeIntegrationRoutes } from "@stackra/integrations/testing";
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import { DisputeStatus } from "#contracts/enums/dispute-status.enum";
import { PaymentStatus } from "#contracts/enums/payment-status.enum";
import { TransferStatus } from "#contracts/enums/transfer-status.enum";
import { PaymentFieldRequiredError } from "#core/errors/payment-field-required.error";
import { CheckoutConnection } from "#core/providers/checkout/checkout.connection";
import { CheckoutIntegration } from "#core/providers/checkout/checkout.integration";

const amount = Money.ofMinor(10_000, "AED");
const request = {
  reference: "ord_1",
  amount,
  description: "Order 1",
  returnUrl: "https://shop.example/ok",
  cancelUrl: "https://shop.example/no",
};

const connect = (routes: (r: FakeIntegrationRoutes) => unknown) =>
  makeConnection(CheckoutConnection, {
    api: fakeIntegrationApi(CheckoutIntegration, routes),
    fields: { secretKey: "sk_x", processingChannelId: "pc_1" },
  });

describe("CheckoutConnection", () => {
  it("refuses a checkout with no billing country", async () => {
    await expect(connect(() => undefined).checkout(request)).rejects.toRefuseWith(
      refusal(PaymentFieldRequiredError, { provider: "checkout", field: "customer.address" }),
    );
  });

  it("opens a hosted page, or a payment link when the checkout expires", async () => {
    const bodies: unknown[] = [];
    const cko = connect((r) =>
      r
        .post("/hosted-payments")
        .returns((_p, { body }) => {
          bodies.push(body);
          return { id: "hpp_1", _links: { redirect: { href: "https://pay.checkout.com/hpp_1" } } };
        })
        .post("/payment-links")
        .returns((_p, { body }) => {
          bodies.push(body);
          return {
            id: "pl_1",
            expires_on: "2030-01-01T00:00:00Z",
            _links: { redirect: { href: "https://pay.checkout.com/pl_1" } },
          };
        }),
    );
    const customer = { address: { line1: "1 Road", city: "Dubai", country: "AE" } };
    const page = await cko.checkout({
      ...request,
      tip: Money.ofMinor(500, "AED"),
      customer,
      captureLater: true,
    });
    expect(page).toMatchObject({ providerRef: "hpp_1", kind: "redirect" });
    expect(bodies[0]).toMatchObject({
      amount: 10_500,
      currency: "AED",
      capture: false,
      processing_channel_id: "pc_1",
      billing: { address: { country: "AE" } },
    });
    const link = await cko.checkout({
      ...request,
      customer,
      expiresAt: new Date(Date.now() + 86_400_000),
    });
    expect(link).toMatchObject({ providerRef: "pl_1", url: "https://pay.checkout.com/pl_1" });
  });

  it("looks up by reference and captures, voids and refunds by payment id", async () => {
    const payment = { id: "pay_1", status: "Authorized", amount: 10_000, currency: "AED" };
    const cko = connect((r) =>
      r
        .get("/payments")
        .returns(() => ({ data: [payment] }))
        .post("/payments/:id/captures")
        .returns(() => ({ action_id: "act_1" }))
        .post("/payments/:id/voids")
        .returns(() => ({ action_id: "act_2" }))
        .post("/payments/:id/refunds")
        .returns(() => ({ action_id: "act_3" })),
    );
    expect(await cko.lookup({ reference: "ord_1" })).toMatchObject({
      providerRef: "pay_1",
      status: PaymentStatus.Authorized,
    });
    expect(
      (await cko.capture({ payment: { reference: "ord_1" }, amount, reference: "c1" })).status,
    ).toBe(PaymentStatus.Captured);
    expect((await cko.void({ reference: "ord_1" })).status).toBe(PaymentStatus.Voided);
    expect(
      await cko.refund({
        payment: { reference: "ord_1", providerRef: "pay_1" },
        amount,
        reference: "r1",
      }),
    ).toEqual({
      providerRef: "act_3",
      status: TransferStatus.Pending,
    });
  });

  it("maps a dispute", async () => {
    const cko = connect((r) =>
      r.get("/disputes/:id").returns(() => ({
        id: "dsp_1",
        status: "evidence_required",
        amount: 10_000,
        currency: "AED",
        reason_code: "10.4",
        payment_id: "pay_1",
        evidence_required_by: "2030-01-01T00:00:00Z",
      })),
    );
    expect(await cko.dispute("dsp_1")).toMatchObject({
      status: DisputeStatus.NeedsResponse,
      paymentRef: "pay_1",
      reason: "10.4",
    });
  });
});
