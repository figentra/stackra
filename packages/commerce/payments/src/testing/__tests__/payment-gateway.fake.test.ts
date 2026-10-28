/**
 * Stackra file contract:
 * Purpose: unit tests of `PaymentGatewayFake`: a checkout is found by reference and by provider id, the customer's
 *          payment moves it, capture, void and refund change its state, a saved token is pre-authorised and its hold raised once per
 *          increment reference, and a lost answer still acts.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0357 (decision 6); STA-1024.
 */
import { refusal } from "@stackra/errors/testing";
import { ProviderUnavailableError } from "@stackra/integrations";
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import { DisputeStatus } from "#contracts/enums/dispute-status.enum";
import { PaymentStatus } from "#contracts/enums/payment-status.enum";
import { TransferStatus } from "#contracts/enums/transfer-status.enum";
import { PaymentGatewayFake } from "#testing/payment-gateway.fake";

const amount = Money.ofMinor(5000, "SAR");
const request = {
  reference: "ord_1",
  amount,
  description: "Order 1",
  returnUrl: "https://shop.example/ok",
  cancelUrl: "https://shop.example/cancel",
};

describe("PaymentGatewayFake", () => {
  it("opens a checkout the customer then pays", async () => {
    const gateway = PaymentGatewayFake.with();
    const session = await gateway.checkout(request);
    expect(await gateway.lookup({ reference: "ord_1" })).toMatchObject({
      providerRef: session.providerRef,
      status: PaymentStatus.Pending,
    });
    gateway.settle(session.providerRef, PaymentStatus.Authorized);
    const captured = await gateway.capture({
      payment: { reference: "ord_1", providerRef: session.providerRef },
      amount,
      reference: "cap_1",
    });
    expect(captured.status).toBe(PaymentStatus.Captured);
    const refund = await gateway.refund({
      payment: { reference: "ord_1" },
      amount,
      reference: "r1",
    });
    expect(refund.status).toBe(TransferStatus.Succeeded);
    expect((await gateway.lookup({ reference: "ord_1" }))?.status).toBe(PaymentStatus.Refunded);
  });

  it("acts and then loses the answer", async () => {
    const gateway = PaymentGatewayFake.with().loseNext();
    await expect(gateway.checkout(request)).rejects.toRefuseWith(refusal(ProviderUnavailableError));
    expect(await gateway.lookup({ reference: "ord_1" })).not.toBeNull();
  });

  it("moves a dispute and a terminal session", async () => {
    const gateway = PaymentGatewayFake.with();
    await gateway.startTerminal({ reference: "t1", terminalId: "tmr_1", amount });
    gateway.settle("fake_t1", PaymentStatus.Captured, Money.ofMinor(500, "SAR"));
    expect((await gateway.terminalSession("fake_t1", "tmr_1")).tip?.minor).toBe(500);
    gateway.openDispute("dp_1", "fake_t1");
    expect((await gateway.respond("dp_1")).status).toBe(DisputeStatus.UnderReview);
    expect((await gateway.accept("dp_1")).status).toBe(DisputeStatus.Accepted);
  });

  it("pre-authorises a token and raises the hold once per increment", async () => {
    const gateway = PaymentGatewayFake.with();
    const method = {
      provider: "fake",
      connectionId: "conn_fake",
      token: "tok_1",
      merchantInitiated: false,
    };
    const held = await gateway.authorize({
      reference: "tab_1",
      method,
      amount,
      initiator: "customer",
    });
    expect(held).toMatchObject({ status: PaymentStatus.Authorized, amount: { minor: 5000 } });
    const raise = { payment: { reference: "tab_1" }, amount, reference: "tab_1:2" };
    expect((await gateway.increment(raise)).amount.minor).toBe(10_000);
    expect((await gateway.increment(raise)).amount.minor).toBe(10_000);
  });
});
