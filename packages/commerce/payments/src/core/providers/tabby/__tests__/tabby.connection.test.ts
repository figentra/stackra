/**
 * Stackra file contract:
 * Purpose: unit tests of `TabbyConnection`: a checkout needs the buyer's phone and email, sends decimal amounts and
 *          returns the instalments page; a pre-score rejection is `PaymentDeclinedError`; captures and refunds map
 *          the payment's state; a lookup with no payment id finds nothing.
 * Boundary: test only; the managed client is `fakeIntegrationApi`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0357 (decisions 2 and 6).
 */
import { refusal } from "@stackra/errors/testing";
import { fakeIntegrationApi, makeConnection } from "@stackra/integrations/testing";
import type { FakeIntegrationRoutes } from "@stackra/integrations/testing";
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import { PaymentStatus } from "#contracts/enums/payment-status.enum";
import { PaymentDeclinedError } from "#core/errors/payment-declined.error";
import { PaymentFieldRequiredError } from "#core/errors/payment-field-required.error";
import { TabbyConnection } from "#core/providers/tabby/tabby.connection";
import { TabbyIntegration } from "#core/providers/tabby/tabby.integration";

const amount = Money.ofMinor(30_000, "SAR");
const request = {
  reference: "ord_1",
  amount,
  description: "Order 1",
  returnUrl: "https://shop.example/ok",
  cancelUrl: "https://shop.example/no",
  customer: { phone: "+966500000001", email: "buyer@example.com", name: "Buyer" },
};

const connect = (routes: (r: FakeIntegrationRoutes) => unknown) =>
  makeConnection(TabbyConnection, {
    api: fakeIntegrationApi(TabbyIntegration, routes),
    fields: { secretKey: "sk_test_x", merchantCode: "store_1" },
  });

describe("TabbyConnection", () => {
  it("refuses a checkout without the buyer's phone", async () => {
    await expect(
      connect(() => undefined).checkout({ ...request, customer: { email: "buyer@example.com" } }),
    ).rejects.toRefuseWith(
      refusal(PaymentFieldRequiredError, { provider: "tabby", field: "customer.phone" }),
    );
  });

  it("opens a session with decimal amounts", async () => {
    let sent: unknown;
    const tabby = connect((r) =>
      r.post("/api/v2/checkout").returns((_p, { body }) => {
        sent = body;
        return {
          id: "sess_1",
          status: "created",
          payment: { id: "pay_1" },
          configuration: {
            available_products: { installments: [{ web_url: "https://checkout.tabby.ai/x" }] },
          },
        };
      }),
    );
    expect(await tabby.checkout(request)).toEqual({
      providerRef: "pay_1",
      kind: "redirect",
      url: "https://checkout.tabby.ai/x",
    });
    expect(sent).toMatchObject({
      payment: { amount: "300.00", currency: "SAR", order: { reference_id: "ord_1" } },
      merchant_code: "store_1",
    });
  });

  it("refuses a rejected buyer", async () => {
    const tabby = connect((r) =>
      r.post("/api/v2/checkout").returns(() => ({
        id: "sess_1",
        status: "rejected",
        payment: { id: "pay_1" },
        configuration: { products: { installments: { rejection_reason: "not_available" } } },
      })),
    );
    await expect(tabby.checkout(request)).rejects.toRefuseWith(
      refusal(PaymentDeclinedError, { provider: "tabby", providerCode: "not_available" }),
    );
  });

  it("captures, refunds in part and finds nothing without an id", async () => {
    const base = { id: "pay_1", amount: "300.00", currency: "SAR" };
    const tabby = connect((r) =>
      r
        .post("/api/v2/payments/:id/captures")
        .returns(() => ({ ...base, status: "CLOSED", captures: [{ id: "c1", amount: "300.00" }] }))
        .post("/api/v2/payments/:id/refunds")
        .returns(() => ({
          ...base,
          status: "CLOSED",
          captures: [{ id: "c1", amount: "300.00" }],
          refunds: [{ id: "r1", amount: "100.00" }],
        })),
    );
    const captured = await tabby.capture({
      payment: { reference: "ord_1", providerRef: "pay_1" },
      amount,
      reference: "c1",
    });
    expect(captured.status).toBe(PaymentStatus.Captured);
    expect(
      await tabby.refund({
        payment: { reference: "ord_1", providerRef: "pay_1" },
        amount: Money.ofMinor(10_000, "SAR"),
        reference: "r1",
      }),
    ).toEqual({ providerRef: "r1", status: "succeeded" });
    expect(await tabby.lookup({ reference: "ord_1" })).toBeNull();
  });
});
