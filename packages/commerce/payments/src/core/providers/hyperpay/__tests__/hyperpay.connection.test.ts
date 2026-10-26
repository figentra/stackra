/**
 * Stackra file contract:
 * Purpose: unit tests of `HyperpayConnection`: a checkout is a widget for amount plus tip with a pre-authorisation
 *          and a registration when asked; a lookup by checkout id maps an authorised payment with its saved
 *          registration; a capture runs CP on the payment id; a merchant-initiated charge is an MIT standing
 *          instruction.
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
import { HyperpayConnection } from "#core/providers/hyperpay/hyperpay.connection";
import { HyperpayIntegration } from "#core/providers/hyperpay/hyperpay.integration";

const amount = Money.ofMinor(9_200, "SAR");
const paymentId = "8ac7a4a28f7b5c0a018f7b6a1d2e3f40";

const connect = (routes: (r: FakeIntegrationRoutes) => unknown) =>
  makeConnection(HyperpayConnection, {
    api: fakeIntegrationApi(HyperpayIntegration, routes),
    fields: { accessToken: "t", entityId: "ent_1" },
  });

describe("HyperpayConnection", () => {
  it("opens a widget checkout with a pre-authorisation and a registration", async () => {
    let sent: Readonly<Record<string, unknown>> = {};
    const hyperpay = connect((r) =>
      r.post("/v1/checkouts").returns((_p, { body }) => {
        sent = body as Readonly<Record<string, unknown>>;
        return { id: "CHK.uat01-vm-tx01" };
      }),
    );
    const session = await hyperpay.checkout({
      reference: "ord_1",
      amount,
      tip: Money.ofMinor(800, "SAR"),
      description: "Order 1",
      returnUrl: "https://shop.example/ok",
      cancelUrl: "https://shop.example/no",
      captureLater: true,
      saveMethod: true,
    });
    expect(session).toEqual({
      providerRef: "CHK.uat01-vm-tx01",
      kind: "widget",
      url: "https://eu-prod.oppwa.com/v1/paymentWidgets.js?checkoutId=CHK.uat01-vm-tx01",
    });
    expect(sent).toMatchObject({
      entityId: "ent_1",
      amount: "100.00",
      paymentType: "PA",
      createRegistration: true,
      merchantTransactionId: "ord_1",
    });
  });

  it("maps an authorised payment with its registration and captures it", async () => {
    const base = {
      id: paymentId,
      paymentType: "PA",
      amount: "92.00",
      currency: "SAR",
      result: { code: "000.100.110" },
      registrationId: "reg_1",
    };
    const hyperpay = connect((r) =>
      r
        .get("/v1/checkouts/:id/payment")
        .returns(() => base)
        .post("/v1/payments/:id")
        .returns(() => ({
          ...base,
          id: "cp_1",
          paymentType: "CP",
          result: { code: "000.000.000" },
        })),
    );
    const found = await hyperpay.lookup({ reference: "ord_1", providerRef: "CHK.uat01-vm-tx01" });
    expect(found).toMatchObject({
      providerRef: paymentId,
      status: PaymentStatus.Authorized,
      method: { token: "reg_1", merchantInitiated: true },
    });
    const captured = await hyperpay.capture({
      payment: { reference: "ord_1", providerRef: paymentId },
      amount,
      reference: "c1",
    });
    expect(captured.status).toBe(PaymentStatus.Captured);
  });

  it("charges a registration as a merchant-initiated standing instruction", async () => {
    let sent: Readonly<Record<string, unknown>> = {};
    const hyperpay = connect((r) =>
      r.post("/v1/registrations/:id/payments").returns((_p, { body }) => {
        sent = body as Readonly<Record<string, unknown>>;
        return {
          id: paymentId,
          paymentType: "DB",
          amount: "92.00",
          currency: "SAR",
          result: { code: "000.000.000" },
        };
      }),
    );
    const paid = await hyperpay.charge({
      reference: "inv_1",
      amount,
      initiator: ChargeInitiator.Merchant,
      method: {
        provider: "hyperpay",
        connectionId: "conn_1",
        token: "reg_1",
        merchantInitiated: true,
      },
    });
    expect(paid.status).toBe(PaymentStatus.Captured);
    expect(sent).toMatchObject({
      "standingInstruction.source": "MIT",
      "standingInstruction.mode": "REPEATED",
      paymentType: "DB",
    });
  });
});
