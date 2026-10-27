/**
 * Stackra file contract:
 * Purpose: `PaymentBalances`, the port of where the engine keeps its `PaymentBalance`s and the lock that serialises
 *          every change to one balance, so concurrent partial payments never take more than is due.
 * Boundary: an abstract class that is its own token, key `payments.PaymentBalances`. The `memory` driver ships here
 *           (one process only); the host binds a durable one with `@Replaces(PaymentBalances)` whose `exclusive` takes
 *           a `Locks` lease from `@stackra/locking` (an advisory lock on Postgres) on `payments.balance:<reference>`.
 *           A leaf file: it imports nothing outside src/contracts.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 15, 16 and 17); ADR 0263 (ports resolve by type); ADR 0103; STA-1024.
 */
import { Port } from "@stackra/contracts";

import type { PaymentBalance } from "#contracts/types/payment-balance.type";

/**
 * The engine's balances.
 *
 * @example
 * export class PostgresPaymentBalancesDriver extends Driver(PaymentBalances) { … }
 */
export abstract class PaymentBalances extends Port {
  /** Type-only port key, so `DriverName<PaymentBalances>` narrows to this port's drivers. */
  declare readonly "~key": "payments.PaymentBalances";

  /** The balance under `reference`, or null. */
  abstract find(reference: string): Promise<PaymentBalance | null>;

  /** Writes `balance`, replacing the one under the same reference. */
  abstract save(balance: PaymentBalance): Promise<void>;

  /** Runs `work` holding the lock of balance `reference`: one holder at a time, the others wait. */
  abstract exclusive<T>(reference: string, work: () => Promise<T>): Promise<T>;
}
