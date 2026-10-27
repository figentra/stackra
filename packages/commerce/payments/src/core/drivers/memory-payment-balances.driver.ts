/**
 * Stackra file contract:
 * Purpose: `MemoryPaymentBalancesDriver`, an in-memory `PaymentBalances` for tests and development: one balance per
 *          reference, replaced on save, and a per-balance lock that queues holders in arrival order.
 * Boundary: the memory driver every port ships before its durable one (ADR 0266); its name is the file prefix
 *           (`memory`). The lock serialises callers in this process only; a host with more than one process binds a
 *           durable driver over `Locks`. Isomorphic, so it ships from the `.` entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 15 and 16); ADR 0266 (decision 2); STA-1024.
 */
import { Driver } from "@stackra/container";

import { PaymentBalances } from "#contracts/ports/payment-balances.port";
import type { PaymentBalance } from "#contracts/types/payment-balance.type";

/**
 * Balances in a Map, locks as promise chains.
 *
 * @example
 * const balances = new MemoryPaymentBalancesDriver();
 * await balances.exclusive("chk_9", async () => balances.save(balance));
 */
export class MemoryPaymentBalancesDriver extends Driver(PaymentBalances) {
  /** Balances by reference. */
  private readonly balances = new Map<string, PaymentBalance>();

  /** The tail of each balance's queue of holders. */
  private readonly tails = new Map<string, Promise<unknown>>();

  /** The balance under `reference`, or null. */
  async find(reference: string): Promise<PaymentBalance | null> {
    return this.balances.get(reference) ?? null;
  }

  /** Writes `balance`, replacing the one under the same reference. */
  async save(balance: PaymentBalance): Promise<void> {
    this.balances.set(balance.reference, balance);
  }

  /** Runs `work` after every earlier holder of `reference` has finished, however it finished. */
  async exclusive<T>(reference: string, work: () => Promise<T>): Promise<T> {
    const before = this.tails.get(reference) ?? Promise.resolve();
    const run = before.then(work, work);
    const tail = run.catch(() => undefined);
    this.tails.set(reference, tail);
    try {
      return await run;
    } finally {
      if (this.tails.get(reference) === tail) this.tails.delete(reference);
    }
  }
}
