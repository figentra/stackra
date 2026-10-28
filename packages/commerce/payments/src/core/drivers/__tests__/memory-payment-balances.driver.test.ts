/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryPaymentBalancesDriver`: an unknown reference is null, a save replaces by reference, and
 *          holders of one balance's lock run one after another (a failing holder frees it) while another balance's
 *          lock is not held up.
 * Boundary: test only; the driver is constructed directly.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0266 (decision 2); STA-1024.
 */
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import { PaymentBalances } from "#contracts/ports/payment-balances.port";
import type { PaymentBalance } from "#contracts/types/payment-balance.type";
import { MemoryPaymentBalancesDriver } from "#core/drivers/memory-payment-balances.driver";

const balance: PaymentBalance = {
  reference: "chk_1",
  amount: Money.ofMinor(1000, "SAR"),
  parts: [],
  updatedAt: new Date("2026-10-25T00:00:00Z"),
};

/** A promise and its resolver. */
function gate(): { readonly wait: Promise<void>; readonly open: () => void } {
  const opener: { open?: () => void } = {};
  const wait = new Promise<void>((resolve) => {
    opener.open = resolve;
  });
  return { wait, open: () => opener.open?.() };
}

describe("MemoryPaymentBalancesDriver", () => {
  it("finds what it saved and replaces by reference", async () => {
    const balances = new MemoryPaymentBalancesDriver();
    expect(balances).toBeInstanceOf(PaymentBalances);
    expect(await balances.find("chk_1")).toBeNull();
    await balances.save(balance);
    await balances.save({
      ...balance,
      parts: [{ reference: "p1", amount: balance.amount, state: "open" }],
    });
    expect((await balances.find("chk_1"))?.parts).toHaveLength(1);
  });

  it("runs the holders of one balance one at a time, and others freely", async () => {
    const balances = new MemoryPaymentBalancesDriver();
    const order: string[] = [];
    const first = gate();
    const a = balances.exclusive("chk_1", async () => {
      order.push("a:start");
      await first.wait;
      order.push("a:end");
      throw new Error("a failed");
    });
    const b = balances.exclusive("chk_1", async () => {
      order.push("b");
      return "b";
    });
    await balances.exclusive("chk_2", async () => {
      order.push("other");
    });
    first.open();
    await expect(a).rejects.toThrow("a failed");
    expect(await b).toBe("b");
    expect(order).toEqual(["a:start", "other", "a:end", "b"]);
  });
});
