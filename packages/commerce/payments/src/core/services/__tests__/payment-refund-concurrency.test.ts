/**
 * Stackra file contract:
 * Purpose: tests of `PaymentService.refund` under concurrency: refunds of one payment that run at the same time are counted
 *          one after the other, so together they never refund more than was taken and the record holds the sum of every
 *          refund the provider accepted (no lost update).
 * Boundary: test only; the service runs over the gateway fake, the gateways fake, the memory records and a fixed clock,
 *           as `payment.service.test.ts` does; the gateway's `refund` is spied on to count what reached the provider.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0220 (decision 4: balances are derived, a mistake is a visible reversal); ADR 0357
 *                     (decision 5: refunds are counted when confirmed); ADR 0388.
 */
import { Clock } from "@stackra/contracts";
import { Money } from "@stackra/money";
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { PaymentStatus } from "#contracts/enums/payment-status.enum";
import { MemoryPaymentRecordsDriver } from "#core/drivers/memory-payment-records.driver";
import { InvalidPaymentTransitionError } from "#core/errors/invalid-payment-transition.error";
import { PaymentService } from "#core/services/payment.service";
import { ConnectedAccountLimitsFake } from "#testing/connected-account-limits.fake";
import { paymentLocksOf } from "#testing/payment-locks-of.function";
import { PaymentGatewayFake } from "#testing/payment-gateway.fake";
import { PaymentGatewaysFake } from "#testing/payment-gateways.fake";

/** A clock that reads a set instant. */
class FixedClock extends Clock {
  now(): Date {
    return new Date("2026-10-25T10:00:00Z");
  }
}

const request = {
  reference: "ord_1",
  amount: Money.ofMinor(10_000, "SAR"),
  description: "Order 1",
  returnUrl: "https://shop.example/ok",
  cancelUrl: "https://shop.example/no",
  captureLater: true,
};

describe("PaymentService.refund under concurrency", () => {
  let gateway: PaymentGatewayFake;
  let records: MemoryPaymentRecordsDriver;
  let payments: PaymentService;

  beforeEach(async () => {
    gateway = PaymentGatewayFake.with();
    records = new MemoryPaymentRecordsDriver();
    payments = new PaymentService(
      PaymentGatewaysFake.with([gateway]),
      records,
      new FixedClock(),
      ConnectedAccountLimitsFake.with(),
      paymentLocksOf(new FixedClock()),
    );
    const session = await payments.checkout("m1", request);
    gateway.settle(session.providerRef, PaymentStatus.Authorized);
    await payments.reconcile("ord_1");
    await payments.capture("ord_1");
  });

  /** Two refunds that together exceed the 10 000 taken: the provider is asked for one, and the other is refused. */
  it("never issues refunds that together exceed what was taken", async () => {
    const refund = vi.spyOn(gateway, "refund");
    const results = await Promise.allSettled([
      payments.refund("ord_1", Money.ofMinor(6000, "SAR"), "r1"),
      payments.refund("ord_1", Money.ofMinor(6000, "SAR"), "r2"),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((result) => result.status === "rejected");
    expect(rejected?.status === "rejected" && rejected.reason).toBeInstanceOf(
      InvalidPaymentTransitionError,
    );
    expect(refund).toHaveBeenCalledTimes(1);
    expect((await records.find("ord_1"))?.refunded.minor).toBe(6000);
  });

  /** Two partial refunds that fit: both are issued and the record counts both, whichever finishes last. */
  it("counts every refund the provider accepted", async () => {
    const refund = vi.spyOn(gateway, "refund");
    await Promise.all([
      payments.refund("ord_1", Money.ofMinor(3000, "SAR"), "r1"),
      payments.refund("ord_1", Money.ofMinor(2000, "SAR"), "r2"),
    ]);
    expect(refund).toHaveBeenCalledTimes(2);
    expect(await records.find("ord_1")).toMatchObject({
      status: PaymentStatus.PartiallyRefunded,
      refunded: { minor: 5000 },
    });
  });

  /** Refunds that exactly use up the payment, issued together, end `refunded` with the full amount. */
  it("ends refunded with the whole amount when concurrent refunds add up to it", async () => {
    await Promise.all([
      payments.refund("ord_1", Money.ofMinor(4000, "SAR"), "r1"),
      payments.refund("ord_1", Money.ofMinor(6000, "SAR"), "r2"),
    ]);
    expect(await records.find("ord_1")).toMatchObject({
      status: PaymentStatus.Refunded,
      refunded: { minor: 10_000 },
    });
  });
});
