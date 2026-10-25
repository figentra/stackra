/**
 * Stackra file contract:
 * Purpose: unit tests of `PaymentService`: a checkout is reused while open and refused once paid; a lost answer makes
 *          the payment `unknown`, which blocks every action until `reconcile` looks it up (so a retried charge never
 *          charges twice) or a manager resolves it with a reason; a merchant-initiated charge needs the token's flag;
 *          capture and refunds move the state and never refund more than was taken; a provider without capture is
 *          refused; a terminal payment keeps its tip and a cancel reads the final state; a pay link is reused until
 *          it expires.
 * Boundary: test only; the service runs over the gateway fake, the gateways fake, the memory records and a fixed
 *           clock.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0357 (decisions 2, 5 and 6).
 */
import { Clock } from "@stackra/contracts";
import { NotFoundError } from "@stackra/errors";
import { refusal } from "@stackra/errors/testing";
import { Money } from "@stackra/money";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { ChargeInitiator } from "#contracts/enums/charge-initiator.enum";
import { PaymentCapability } from "#contracts/enums/payment-capability.enum";
import { PaymentStatus } from "#contracts/enums/payment-status.enum";
import { MemoryPaymentRecordsDriver } from "#core/drivers/memory-payment-records.driver";
import { CapabilityUnsupportedError } from "#core/errors/capability-unsupported.error";
import { InvalidPaymentTransitionError } from "#core/errors/invalid-payment-transition.error";
import { MerchantInitiatedNotAllowedError } from "#core/errors/merchant-initiated-not-allowed.error";
import { PaymentUnknownError } from "#core/errors/payment-unknown.error";
import { ResolutionReasonRequiredError } from "#core/errors/resolution-reason-required.error";
import { PaymentService } from "#core/services/payment.service";
import { PaymentGatewayFake } from "#testing/payment-gateway.fake";
import { PaymentGatewaysFake } from "#testing/payment-gateways.fake";

/** A clock that reads a set instant. */
class FixedClock extends Clock {
  at = new Date("2026-10-25T10:00:00Z");

  now(): Date {
    return new Date(this.at);
  }
}

const amount = Money.ofMinor(10_000, "SAR");
const request = {
  reference: "ord_1",
  amount,
  description: "Order 1",
  returnUrl: "https://shop.example/ok",
  cancelUrl: "https://shop.example/no",
};
const method = {
  provider: "fake",
  connectionId: "conn_fake",
  token: "tok_1",
  merchantInitiated: false,
};

describe("PaymentService", () => {
  let gateway: PaymentGatewayFake;
  let records: MemoryPaymentRecordsDriver;
  let clock: FixedClock;
  let payments: PaymentService;

  beforeEach(() => {
    gateway = PaymentGatewayFake.with();
    records = new MemoryPaymentRecordsDriver();
    clock = new FixedClock();
    payments = new PaymentService(PaymentGatewaysFake.with([gateway]), records, clock);
  });

  it("reuses an open checkout and refuses one that was paid", async () => {
    const session = await payments.checkout("m1", { ...request, tip: Money.ofMinor(500, "SAR") });
    expect(await payments.checkout("m1", request)).toEqual(session);
    expect(await records.find("ord_1")).toMatchObject({
      status: PaymentStatus.Pending,
      tip: { minor: 500 },
      provider: "fake",
    });
    gateway.settle(session.providerRef, PaymentStatus.Captured);
    await expect(payments.checkout("m1", request)).rejects.toRefuseWith(
      refusal(InvalidPaymentTransitionError, {
        reference: "ord_1",
        status: "captured",
        operation: "checkout",
      }),
    );
  });

  it("makes a lost answer unknown and blocks everything until a lookup", async () => {
    gateway.loseNext();
    await expect(payments.checkout("m1", { ...request, captureLater: true })).rejects.toRefuseWith(
      refusal(PaymentUnknownError, { reference: "ord_1" }),
    );
    expect((await records.find("ord_1"))?.status).toBe(PaymentStatus.Unknown);
    await expect(payments.capture("ord_1")).rejects.toRefuseWith(refusal(PaymentUnknownError));
    await expect(payments.checkout("m1", request)).rejects.toRefuseWith(
      refusal(PaymentUnknownError),
    );
    const record = await payments.reconcile("ord_1");
    expect(record).toMatchObject({ status: PaymentStatus.Pending, providerRef: "fake_ord_1" });
  });

  it("never charges a token twice after a lost answer", async () => {
    const charge = { reference: "inv_1", amount, method, initiator: ChargeInitiator.Customer };
    gateway.loseNext();
    await expect(payments.charge(charge)).rejects.toRefuseWith(refusal(PaymentUnknownError));
    await expect(payments.charge(charge)).rejects.toRefuseWith(refusal(PaymentUnknownError));
    expect((await payments.reconcile("inv_1")).status).toBe(PaymentStatus.Captured);
    expect((await payments.charge(charge)).status).toBe(PaymentStatus.Captured);
  });

  it("refuses a merchant-initiated charge the customer did not agree to", async () => {
    await expect(
      payments.charge({ reference: "inv_2", amount, method, initiator: ChargeInitiator.Merchant }),
    ).rejects.toRefuseWith(refusal(MerchantInitiatedNotAllowedError, { reference: "inv_2" }));
    expect(
      (
        await payments.charge({
          reference: "inv_3",
          amount,
          method: { ...method, merchantInitiated: true },
          initiator: ChargeInitiator.Merchant,
        })
      ).status,
    ).toBe(PaymentStatus.Captured);
  });

  it("captures, refunds in parts and never refunds more than was taken", async () => {
    const session = await payments.checkout("m1", { ...request, captureLater: true });
    gateway.settle(session.providerRef, PaymentStatus.Authorized);
    await payments.reconcile("ord_1");
    expect((await payments.capture("ord_1")).status).toBe(PaymentStatus.Captured);
    await payments.refund("ord_1", Money.ofMinor(4_000, "SAR"), "r1");
    expect((await records.find("ord_1"))?.status).toBe(PaymentStatus.PartiallyRefunded);
    await expect(payments.refund("ord_1", Money.ofMinor(7_000, "SAR"), "r2")).rejects.toRefuseWith(
      refusal(InvalidPaymentTransitionError, { operation: "refund" }),
    );
    await payments.refund("ord_1", Money.ofMinor(6_000, "SAR"), "r3");
    expect(await records.find("ord_1")).toMatchObject({
      status: PaymentStatus.Refunded,
      refunded: { minor: 10_000 },
    });
  });

  it("refuses a capture on a provider that takes payment at once", async () => {
    const hosted = PaymentGatewayFake.with({ capabilities: [PaymentCapability.Checkout] });
    const service = new PaymentService(PaymentGatewaysFake.with([hosted]), records, clock);
    const session = await service.checkout("m1", request);
    hosted.settle(session.providerRef, PaymentStatus.Authorized);
    await service.reconcile("ord_1");
    await expect(service.capture("ord_1")).rejects.toRefuseWith(
      refusal(CapabilityUnsupportedError, { provider: "fake", capability: "capture" }),
    );
  });

  it("resolves an unknown payment by hand only with a reason", async () => {
    gateway.loseNext();
    await expect(payments.checkout("m1", request)).rejects.toRefuseWith(
      refusal(PaymentUnknownError),
    );
    await expect(
      payments.resolve("ord_1", PaymentStatus.Captured, { by: "usr_1", reason: "  " }),
    ).rejects.toRefuseWith(refusal(ResolutionReasonRequiredError));
    await expect(
      payments.resolve("ord_1", PaymentStatus.Refunded, { by: "usr_1", reason: "x" }),
    ).rejects.toRefuseWith(refusal(InvalidPaymentTransitionError, { operation: "resolve" }));
    const record = await payments.resolve("ord_1", PaymentStatus.Captured, {
      by: "usr_1",
      reason: "Receipt printed",
    });
    expect(record).toMatchObject({
      status: PaymentStatus.Captured,
      resolution: { by: "usr_1", reason: "Receipt printed" },
    });
    await expect(
      payments.resolve("ord_1", PaymentStatus.Failed, { by: "usr_1", reason: "again" }),
    ).rejects.toRefuseWith(refusal(InvalidPaymentTransitionError));
  });

  it("marks an unknown payment the provider never saw as failed", async () => {
    await records.save({
      reference: "ord_9",
      provider: "fake",
      connectionId: "conn_fake",
      amount,
      refunded: Money.zero("SAR"),
      status: PaymentStatus.Unknown,
      updatedAt: clock.now(),
    });
    expect((await payments.reconcile("ord_9")).status).toBe(PaymentStatus.Failed);
    await expect(payments.reconcile("ord_0")).rejects.toRefuseWith(refusal(NotFoundError));
  });

  it("keeps a terminal tip and reads the final state after a cancel", async () => {
    const tipPrompt = { percentages: [10, 15], custom: true };
    const session = await payments.startTerminal("m1", {
      reference: "chk_1",
      terminalId: "tmr_1",
      amount,
      tipPrompt,
    });
    gateway.settle(session.providerRef, PaymentStatus.Captured, Money.ofMinor(1_000, "SAR"));
    expect(await payments.reconcile("chk_1")).toMatchObject({
      status: PaymentStatus.Captured,
      tip: { minor: 1_000 },
    });
    await payments.startTerminal("m1", { reference: "chk_2", terminalId: "tmr_1", amount });
    expect((await payments.cancelTerminal("chk_2")).status).toBe(PaymentStatus.Voided);
  });

  it("reuses a pay link until it expires", async () => {
    const expiresAt = new Date("2026-10-26T10:00:00Z");
    const link = await payments.payLink("m1", { ...request, expiresAt });
    expect(link).toEqual({ reference: "ord_1", url: "https://pay.example/fake_ord_1", expiresAt });
    expect(await payments.payLink("m1", { ...request, expiresAt })).toEqual(link);
    clock.at = new Date("2026-10-27T10:00:00Z");
    const renewed = await payments.payLink("m1", {
      ...request,
      expiresAt: new Date("2026-10-28T10:00:00Z"),
    });
    expect(renewed.expiresAt).toEqual(new Date("2026-10-28T10:00:00Z"));
  });
});
