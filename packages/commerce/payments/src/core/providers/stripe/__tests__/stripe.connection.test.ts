/**
 * Stackra file contract:
 * Purpose: unit tests of `StripeConnection`: a checkout opens a Checkout Session with the total, the reference and the
 *          hold, save and platform options; a paid session is read through its PaymentIntent with the saved card; a
 *          capture, refund and merchant-initiated charge hit the right endpoints; onboarding needs the account type;
 *          a terminal payment carries its tip; a dispute maps its state.
 * Boundary: test only; the managed client is `fakeIntegrationApi`, so no network is touched.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0357 (decisions 2, 5 and 6).
 */
import { refusal } from "@stackra/errors/testing";
import { fakeIntegrationApi, makeConnection } from "@stackra/integrations/testing";
import type { FakeIntegrationRoutes } from "@stackra/integrations/testing";
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import { ChargeInitiator } from "#contracts/enums/charge-initiator.enum";
import { DisputeStatus } from "#contracts/enums/dispute-status.enum";
import { PaymentStatus } from "#contracts/enums/payment-status.enum";
import { TransferStatus } from "#contracts/enums/transfer-status.enum";
import { CapabilityUnsupportedError } from "#core/errors/capability-unsupported.error";
import { StripeConnection } from "#core/providers/stripe/stripe.connection";
import { StripeIntegration } from "#core/providers/stripe/stripe.integration";

const amount = Money.ofMinor(10_000, "SAR");

/** An intent the fake answers with. */
const intent = (status: string, extra: object = {}) => ({
  id: "pi_1",
  status,
  amount: 11_000,
  amount_received: status === "succeeded" ? 11_000 : 0,
  currency: "sar",
  ...extra,
});

/** A Stripe connection over routes the test writes. */
const connect = (routes: (r: FakeIntegrationRoutes) => unknown, fields: object = {}) =>
  makeConnection(StripeConnection, {
    api: fakeIntegrationApi(StripeIntegration, routes),
    fields: { secretKey: "sk_test_x", ...fields },
  });

describe("StripeConnection", () => {
  it("opens a Checkout Session for amount plus tip", async () => {
    let sent: Readonly<Record<string, unknown>> = {};
    const stripe = connect((r) =>
      r.post("/v1/checkout/sessions").returns((_p, { query }) => {
        sent = query;
        return {
          id: "cs_1",
          url: "https://checkout.stripe.com/c/cs_1",
          status: "open",
          amount_total: 11_000,
          currency: "sar",
          expires_at: 1_800_000_000,
        };
      }),
    );
    const session = await stripe.checkout({
      reference: "ord_1",
      amount,
      tip: Money.ofMinor(1_000, "SAR"),
      description: "Order 1",
      returnUrl: "https://shop.example/ok",
      cancelUrl: "https://shop.example/no",
      captureLater: true,
      saveMethod: true,
      platform: { accountRef: "acct_9", fee: Money.ofMinor(250, "SAR") },
    });
    expect(session).toMatchObject({ providerRef: "cs_1", kind: "redirect" });
    expect(sent).toMatchObject({
      client_reference_id: "ord_1",
      "line_items[0][price_data][unit_amount]": 11_000,
      "line_items[0][price_data][currency]": "sar",
      "payment_intent_data[capture_method]": "manual",
      "payment_intent_data[setup_future_usage]": "off_session",
      "payment_intent_data[application_fee_amount]": 250,
      "payment_intent_data[transfer_data][destination]": "acct_9",
      "metadata[reference]": "ord_1",
    });
  });

  it("reads a paid session through its intent, with the saved card", async () => {
    const stripe = connect((r) =>
      r.get("/v1/checkout/sessions/:id").returns(() => ({
        id: "cs_1",
        url: null,
        status: "complete",
        amount_total: 11_000,
        currency: "sar",
        expires_at: 1_800_000_000,
        payment_intent: intent("requires_capture", {
          customer: "cus_1",
          setup_future_usage: "off_session",
          payment_method: { id: "pm_1", card: { brand: "visa", last4: "4242" } },
        }),
      })),
    );
    const found = await stripe.lookup({ reference: "ord_1", providerRef: "cs_1" });
    expect(found).toMatchObject({ providerRef: "pi_1", status: PaymentStatus.Authorized });
    expect(found?.method).toMatchObject({
      token: "pm_1",
      merchantInitiated: true,
      customerRef: "cus_1",
      last4: "4242",
    });
  });

  it("captures, refunds and charges a token as merchant-initiated", async () => {
    let charged: Readonly<Record<string, unknown>> = {};
    const stripe = connect((r) =>
      r
        .post("/v1/payment_intents/:id/capture")
        .returns(() => intent("succeeded", { latest_charge: { amount_refunded: 0 } }))
        .post("/v1/refunds")
        .returns(() => ({ id: "re_1", status: "pending" }))
        .post("/v1/payment_intents")
        .returns((_p, { query }) => {
          charged = query;
          return intent("succeeded", { id: "pi_2" });
        }),
    );
    const captured = await stripe.capture({
      payment: { reference: "ord_1", providerRef: "pi_1" },
      amount,
      reference: "cap_1",
    });
    expect(captured.status).toBe(PaymentStatus.Captured);
    const refund = await stripe.refund({
      payment: { reference: "ord_1", providerRef: "pi_1" },
      amount,
      reference: "r1",
    });
    expect(refund).toEqual({ providerRef: "re_1", status: TransferStatus.Pending });
    await stripe.charge({
      reference: "inv_1",
      amount,
      initiator: ChargeInitiator.Merchant,
      method: {
        provider: "stripe",
        connectionId: "conn_1",
        token: "pm_1",
        customerRef: "cus_1",
        merchantInitiated: true,
      },
    });
    expect(charged).toMatchObject({
      payment_method: "pm_1",
      customer: "cus_1",
      confirm: true,
      off_session: true,
    });
  });

  it("refuses onboarding without a Connect account type", async () => {
    const stripe = connect(() => undefined);
    await expect(
      stripe.onboard({
        reference: "org_1",
        country: "XX",
        returnUrl: "https://a.example",
        refreshUrl: "https://b.example",
      }),
    ).rejects.toRefuseWith(
      refusal(CapabilityUnsupportedError, { provider: "stripe", capability: "platform" }),
    );
  });

  it("onboards with the configured account type", async () => {
    const stripe = connect(
      (r) =>
        r
          .post("/v1/accounts")
          .returns((_p, { query }) => ({
            id: "acct_1",
            charges_enabled: false,
            payouts_enabled: false,
            type: query.type,
          }))
          .post("/v1/account_links")
          .returns(() => ({ url: "https://connect.stripe.com/setup/x" })),
      { connectAccountType: "express" },
    );
    expect(
      await stripe.onboard({
        reference: "org_1",
        country: "XX",
        returnUrl: "https://a.example",
        refreshUrl: "https://b.example",
      }),
    ).toEqual({
      accountRef: "acct_1",
      onboardingUrl: "https://connect.stripe.com/setup/x",
      chargesEnabled: false,
      payoutsEnabled: false,
    });
  });

  it("presents a terminal payment with a tip and reads the tip back", async () => {
    let processed: Readonly<Record<string, unknown>> = {};
    const stripe = connect((r) =>
      r
        .post("/v1/payment_intents")
        .returns(() => intent("requires_payment_method", { id: "pi_t" }))
        .post("/v1/terminal/readers/:reader/process_payment_intent")
        .returns((_p, { query }) => {
          processed = query;
          return {};
        })
        .get("/v1/payment_intents/:id")
        .returns(() =>
          intent("succeeded", { id: "pi_t", amount_details: { tip: { amount: 1_000 } } }),
        ),
    );
    const session = await stripe.startTerminal({
      reference: "chk_1",
      terminalId: "tmr_1",
      amount,
      tipPrompt: { percentages: [10, 15], custom: true },
    });
    expect(session).toEqual({
      providerRef: "pi_t",
      terminalId: "tmr_1",
      status: PaymentStatus.Pending,
    });
    expect(processed).toMatchObject({
      payment_intent: "pi_t",
      "process_config[tipping][amount_eligible]": 10_000,
    });
    expect((await stripe.terminalSession("pi_t", "tmr_1")).tip?.minor).toBe(1_000);
  });

  it("maps a dispute and accepts it", async () => {
    const dispute = {
      id: "dp_1",
      amount: 5_000,
      currency: "sar",
      reason: "fraudulent",
      payment_intent: "pi_1",
      charge: "ch_1",
    };
    const stripe = connect((r) =>
      r
        .get("/v1/disputes/:id")
        .returns(() => ({
          ...dispute,
          status: "needs_response",
          evidence_details: { due_by: 1_800_000_000 },
        }))
        .post("/v1/disputes/:id/close")
        .returns(() => ({ ...dispute, status: "lost" })),
    );
    expect(await stripe.dispute("dp_1")).toMatchObject({
      status: DisputeStatus.NeedsResponse,
      paymentRef: "pi_1",
    });
    expect((await stripe.accept("dp_1")).status).toBe(DisputeStatus.Accepted);
  });
});
