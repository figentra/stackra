/**
 * Stackra file contract:
 * Purpose: tests of `PaymentService.refund` as an idempotent call: a refund sent again with the same reference and amount is
 *          answered with its first answer and counted once (also when it was the refund that used the payment up, and when
 *          two copies run at the same moment), the same reference with another amount is refused, a refund the provider
 *          failed is not remembered so its reference can be tried again, and different references each count.
 * Boundary: test only; the service runs over the gateway fake, the gateways fake, the memory records and a fixed clock, as
 *           `payment.service.test.ts` does; the gateway's `refund` is spied on to count what reached the provider.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0357 (decision 5: refunds are counted when confirmed); ADR 0388; ADR 0220 (decision 5).
 */
import { Clock } from "@stackra/contracts";
import { refusal } from "@stackra/errors/testing";
import { Money } from "@stackra/money";
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { PaymentStatus } from "#contracts/enums/payment-status.enum";
import { TransferStatus } from "#contracts/enums/transfer-status.enum";
import { MemoryPaymentRecordsDriver } from "#core/drivers/memory-payment-records.driver";
import { RefundReferenceReusedError } from "#core/errors/refund-reference-reused.error";
import { PaymentService } from "#core/services/payment.service";
import { ConnectedAccountLimitsFake } from "#testing/connected-account-limits.fake";
import { PaymentGatewayFake } from "#testing/payment-gateway.fake";
import { PaymentGatewaysFake } from "#testing/payment-gateways.fake";
import { paymentLocksOf } from "#testing/payment-locks-of.function";

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

describe("PaymentService.refund as an idempotent call", () => {
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

  /** The same refund sent twice (a client retry after a timeout): one refund at the provider, one in the record. */
  it("answers a repeat with the first answer and counts the refund once", async () => {
    const refund = vi.spyOn(gateway, "refund");
    const first = await payments.refund("ord_1", Money.ofMinor(3000, "SAR"), "r1");
    const second = await payments.refund("ord_1", Money.ofMinor(3000, "SAR"), "r1");
    expect(second).toEqual(first);
    expect(refund).toHaveBeenCalledTimes(1);
    expect(await records.find("ord_1")).toMatchObject({
      status: PaymentStatus.PartiallyRefunded,
      refunded: { minor: 3000 },
      refunds: [{ reference: "r1", amount: { minor: 3000 }, providerRef: first.providerRef }],
    });
  });

  /** The refund that used the payment up, retried: the first answer, not a refusal of a payment already refunded. */
  it("answers a retry of the refund that completed the payment instead of refusing it", async () => {
    const first = await payments.refund("ord_1", Money.ofMinor(10_000, "SAR"), "full");
    expect((await records.find("ord_1"))?.status).toBe(PaymentStatus.Refunded);
    await expect(payments.refund("ord_1", Money.ofMinor(10_000, "SAR"), "full")).resolves.toEqual(
      first,
    );
    expect(await records.find("ord_1")).toMatchObject({
      status: PaymentStatus.Refunded,
      refunded: { minor: 10_000 },
    });
  });

  /** Two copies of one refund at the same moment: the lock makes the second one a repeat. */
  it("counts two concurrent copies of one refund once", async () => {
    const refund = vi.spyOn(gateway, "refund");
    const [a, b] = await Promise.all([
      payments.refund("ord_1", Money.ofMinor(4000, "SAR"), "r1"),
      payments.refund("ord_1", Money.ofMinor(4000, "SAR"), "r1"),
    ]);
    expect(b).toEqual(a);
    expect(refund).toHaveBeenCalledTimes(1);
    expect((await records.find("ord_1"))?.refunded.minor).toBe(4000);
  });

  /** One key must mean one refund. */
  it("refuses a reference that was used for another amount, and changes nothing", async () => {
    await payments.refund("ord_1", Money.ofMinor(3000, "SAR"), "r1");
    await expect(payments.refund("ord_1", Money.ofMinor(2000, "SAR"), "r1")).rejects.toRefuseWith(
      refusal(RefundReferenceReusedError, { reference: "ord_1", refundReference: "r1" }),
    );
    await expect(payments.refund("ord_1", Money.ofMinor(3000, "EUR"), "r1")).rejects.toRefuseWith(
      refusal(RefundReferenceReusedError, { reference: "ord_1", refundReference: "r1" }),
    );
    expect((await records.find("ord_1"))?.refunded.minor).toBe(3000);
  });

  /** A refund the provider failed moved no money, so it is not remembered and its reference may be sent again. */
  it("does not remember a refund the provider failed", async () => {
    const refund = vi.spyOn(gateway, "refund");
    refund.mockResolvedValueOnce({ providerRef: "rfd_failed", status: TransferStatus.Failed });
    const failed = await payments.refund("ord_1", Money.ofMinor(3000, "SAR"), "r1");
    expect(failed.status).toBe(TransferStatus.Failed);
    expect((await records.find("ord_1"))?.refunds).toBeUndefined();
    expect((await records.find("ord_1"))?.refunded.minor).toBe(0);
    const retried = await payments.refund("ord_1", Money.ofMinor(3000, "SAR"), "r1");
    expect(retried.status).toBe(TransferStatus.Succeeded);
    expect(refund).toHaveBeenCalledTimes(2);
    expect((await records.find("ord_1"))?.refunded.minor).toBe(3000);
  });

  /** Different references are different refunds: each reaches the provider and each counts. */
  it("counts refunds under different references each", async () => {
    const refund = vi.spyOn(gateway, "refund");
    await payments.refund("ord_1", Money.ofMinor(3000, "SAR"), "r1");
    await payments.refund("ord_1", Money.ofMinor(2000, "SAR"), "r2");
    expect(refund).toHaveBeenCalledTimes(2);
    expect(await records.find("ord_1")).toMatchObject({
      refunded: { minor: 5000 },
      refunds: [{ reference: "r1" }, { reference: "r2" }],
    });
  });
});
