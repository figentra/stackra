/**
 * Stackra file contract:
 * Purpose: unit tests of `PaymentBalanceService`: concurrent parts against one balance never take more than is due
 *          (the late payer is refused), a retried part keeps one reservation, a failed part frees its share, `settle`
 *          counts each paid part once however often it runs and stamps the balance settled once covered, an unknown
 *          part is looked up before it counts, and a settled balance takes no more parts.
 * Boundary: test only; the service runs over the real `PaymentService`, the gateway fake, the memory records, the
 *           memory balances (its lock) and a fixed clock.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0357 (decision 6); STA-1024.
 */
import { Clock } from "@stackra/contracts";
import { isRefusal, NotFoundError } from "@stackra/errors";
import { refusal } from "@stackra/errors/testing";
import { Money } from "@stackra/money";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { PaymentCapability } from "#contracts/enums/payment-capability.enum";
import { PaymentStatus } from "#contracts/enums/payment-status.enum";
import { MemoryPaymentBalancesDriver } from "#core/drivers/memory-payment-balances.driver";
import { MemoryPaymentRecordsDriver } from "#core/drivers/memory-payment-records.driver";
import { BalanceExceededError } from "#core/errors/balance-exceeded.error";
import { NoPaymentProviderError } from "#core/errors/no-payment-provider.error";
import { PaymentUnknownError } from "#core/errors/payment-unknown.error";
import { PaymentBalanceService } from "#core/services/payment-balance.service";
import { PaymentService } from "#core/services/payment.service";
import { ConnectedAccountLimitsFake } from "#testing/connected-account-limits.fake";
import { PaymentGatewayFake } from "#testing/payment-gateway.fake";
import { PaymentGatewaysFake } from "#testing/payment-gateways.fake";

/** A clock that reads a set instant. */
class FixedClock extends Clock {
  now(): Date {
    return new Date("2026-10-25T10:00:00Z");
  }
}

const sar = (minor: number): Money => Money.ofMinor(minor, "SAR");

/** A QR checkout of `minor` for part `reference`. */
function part(reference: string, minor: number) {
  return {
    reference,
    amount: sar(minor),
    description: "Check 9",
    returnUrl: "https://table.example/ok",
    cancelUrl: "https://table.example/no",
  };
}

describe("PaymentBalanceService", () => {
  let gateway: PaymentGatewayFake;
  let records: MemoryPaymentRecordsDriver;
  let parts: PaymentBalanceService;

  /** The service over `gateways`. */
  function over(gateways: readonly PaymentGatewayFake[]): PaymentBalanceService {
    const clock = new FixedClock();
    const payments = new PaymentService(
      PaymentGatewaysFake.with(gateways),
      records,
      clock,
      ConnectedAccountLimitsFake.with(),
    );
    return new PaymentBalanceService(payments, new MemoryPaymentBalancesDriver(), records, clock);
  }

  beforeEach(async () => {
    gateway = PaymentGatewayFake.with();
    records = new MemoryPaymentRecordsDriver();
    parts = over([gateway]);
    await parts.open("chk_9", sar(30_000));
  });

  it("opens once and refuses an unknown balance", async () => {
    expect((await parts.open("chk_9", sar(1))).amount.minor).toBe(30_000);
    await expect(parts.remaining("chk_0")).rejects.toThrow(NotFoundError);
  });

  it("never lets concurrent payers take more than is due", async () => {
    const results = await Promise.allSettled([
      parts.checkout("m1", "chk_9", part("chk_9:1", 20_000)),
      parts.checkout("m1", "chk_9", part("chk_9:2", 20_000)),
      parts.checkout("m1", "chk_9", part("chk_9:3", 10_000)),
    ]);
    expect(results.map((result) => result.status)).toEqual(["fulfilled", "rejected", "fulfilled"]);
    const late = results[1];
    expect(late?.status === "rejected" && isRefusal(late.reason, BalanceExceededError)).toBe(true);
    expect((await parts.remaining("chk_9")).minor).toBe(0);
    expect(await records.find("chk_9:2")).toBeNull();
  });

  it("keeps one reservation for a retried part", async () => {
    const first = await parts.checkout("m1", "chk_9", part("chk_9:1", 10_000));
    expect(await parts.checkout("m1", "chk_9", part("chk_9:1", 10_000))).toEqual(first);
    expect((await parts.remaining("chk_9")).minor).toBe(20_000);
  });

  it("settles each paid part once and stamps the balance settled when covered", async () => {
    const a = await parts.checkout("m1", "chk_9", part("chk_9:1", 10_000));
    const b = await parts.checkout("m1", "chk_9", part("chk_9:2", 20_000));
    gateway.settle(a.providerRef, PaymentStatus.Captured);
    const once = await parts.settle("chk_9");
    expect(once.parts.map((entry) => entry.state)).toEqual(["paid", "open"]);
    expect(once.settledAt).toBeUndefined();
    gateway.settle(b.providerRef, PaymentStatus.Captured);
    const settled = await parts.settle("chk_9");
    expect(settled.parts.map((entry) => entry.state)).toEqual(["paid", "paid"]);
    expect(settled.settledAt).toEqual(new Date("2026-10-25T10:00:00Z"));
    expect(await parts.settle("chk_9")).toMatchObject({
      parts: settled.parts,
      settledAt: settled.settledAt,
    });
    await expect(parts.checkout("m1", "chk_9", part("chk_9:3", 1))).rejects.toRefuseWith(
      refusal(BalanceExceededError, { part: "chk_9:3" }),
    );
  });

  it("frees the share of a part whose payment failed", async () => {
    const a = await parts.checkout("m1", "chk_9", part("chk_9:1", 30_000));
    gateway.settle(a.providerRef, PaymentStatus.Failed);
    expect((await parts.settle("chk_9")).parts[0]?.state).toBe("released");
    expect((await parts.remaining("chk_9")).minor).toBe(30_000);
    await parts.checkout("m1", "chk_9", part("chk_9:1", 30_000));
    expect((await parts.remaining("chk_9")).minor).toBe(0);
  });

  it("releases the share when no provider takes the part", async () => {
    const none = over([PaymentGatewayFake.with({ capabilities: [PaymentCapability.Terminal] })]);
    await none.open("chk_9", sar(30_000));
    await expect(none.checkout("m1", "chk_9", part("chk_9:1", 30_000))).rejects.toRefuseWith(
      refusal(NoPaymentProviderError),
    );
    expect((await none.remaining("chk_9")).minor).toBe(30_000);
  });

  it("keeps an unknown part reserved and looks it up when settling", async () => {
    gateway.loseNext();
    await expect(
      parts.startTerminal("m1", "chk_9", {
        reference: "chk_9:1",
        terminalId: "tmr_1",
        amount: sar(30_000),
      }),
    ).rejects.toRefuseWith(refusal(PaymentUnknownError, { reference: "chk_9:1" }));
    expect((await parts.remaining("chk_9")).minor).toBe(0);
    gateway.settle("fake_chk_9:1", PaymentStatus.Captured, sar(1_000));
    const settled = await parts.settle("chk_9");
    expect(settled.parts[0]).toMatchObject({ state: "paid", amount: { minor: 30_000 } });
    expect(settled.settledAt).toBeDefined();
  });
});
