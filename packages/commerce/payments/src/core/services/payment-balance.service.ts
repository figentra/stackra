/**
 * Stackra file contract:
 * Purpose: `PaymentBalanceService`, concurrent partial payments against one balance (pay at table: several guests pay
 *          one check at once, by QR checkout or on a terminal): each part is reserved under the balance's lock, so the
 *          open and paid parts never exceed what is due, then paid through `PaymentService` under its own reference;
 *          `settle` reads each open part's payment and marks it paid or released, counting a part once however often
 *          it runs, and stamps the balance settled once the paid parts cover it.
 * Boundary: generic over `PaymentBalances` (the store and its lock), `PaymentRecords` (read only) and `PaymentService`
 *           (every payment, so the `unknown` state, one payment per reference and the provider choice are unchanged).
 *           The provider is called outside the lock; only the reservation and the settle run under it. How a balance is
 *           split (by seat, item, even) is the product's; this service only refuses a part that does not fit.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decisions 2 and 6); ADR 0103 (locks); STA-1024; mezzora-15 (pay at table).
 */
import { Service } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import { NotFoundError } from "@stackra/errors";
import { Money } from "@stackra/money";

import { PaymentStatus } from "#contracts/enums/payment-status.enum";
import type { PaymentBalances } from "#contracts/ports/payment-balances.port";
import type { PaymentRecords } from "#contracts/ports/payment-records.port";
import type { BalancePart } from "#contracts/types/balance-part.type";
import type { CheckoutRequest } from "#contracts/types/checkout-request.type";
import type { CheckoutSession } from "#contracts/types/checkout-session.type";
import type { PaymentBalance } from "#contracts/types/payment-balance.type";
import type { PaymentRecord } from "#contracts/types/payment-record.type";
import type { TerminalRequest } from "#contracts/types/terminal-request.type";
import type { TerminalSession } from "#contracts/types/terminal-session.type";
import { BalanceExceededError } from "#core/errors/balance-exceeded.error";
import type { PaymentService } from "#core/services/payment.service";

/** Payment states that pay a part. */
const PAID: readonly PaymentStatus[] = [
  PaymentStatus.Captured,
  PaymentStatus.PartiallyRefunded,
  PaymentStatus.Refunded,
];

/** Payment states that free a part's share. */
const RELEASED: readonly PaymentStatus[] = [PaymentStatus.Failed, PaymentStatus.Voided];

/**
 * Partial payments. Inject it by class.
 *
 * @example
 * await parts.open("chk_9", Money.ofMinor(42_000, "SAR"));
 * const session = await parts.checkout(market, "chk_9", { reference: "chk_9:seat_2", amount, ... });
 * // from the return page or a webhook
 * const balance = await parts.settle("chk_9");
 */
export class PaymentBalanceService extends Service {
  /** Every payment goes through the engine. */
  private readonly payments: PaymentService;

  /** The balances and their lock. */
  private readonly balances: PaymentBalances;

  /** The engine's payment state, read to settle parts. */
  private readonly records: PaymentRecords;

  /** The time a balance changes. */
  private readonly clock: Clock;

  /**
   * @param payments - the engine.
   * @param balances - the host's durable store over `Locks`; the memory driver in tests.
   * @param records - the same store `PaymentService` writes.
   * @param clock - the container's clock.
   */
  constructor(
    payments: PaymentService,
    balances: PaymentBalances,
    records: PaymentRecords,
    clock: Clock,
  ) {
    super();
    this.payments = payments;
    this.balances = balances;
    this.records = records;
    this.clock = clock;
  }

  /** Opens the balance `reference` for `amount`; one that is already open is returned as it stands. */
  async open(reference: string, amount: Money): Promise<PaymentBalance> {
    return this.balances.exclusive(reference, async () => {
      const existing = await this.balances.find(reference);
      if (existing !== null) return existing;
      return this.save({ reference, amount, parts: [], updatedAt: this.clock.now() });
    });
  }

  /**
   * What is left to reserve: the amount less the open and the paid parts.
   *
   * @throws NotFoundError when there is no such balance.
   */
  async remaining(reference: string): Promise<Money> {
    return leftOf(await this.load(reference));
  }

  /**
   * Reserves `request.amount` of balance `balance` for the part `request.reference`, then opens its hosted checkout
   * (a QR at the table). A retried part keeps its reservation; a failed call releases it.
   *
   * @throws BalanceExceededError when the part does not fit in what is left, or the balance is settled.
   * @throws NotFoundError when there is no such balance.
   */
  async checkout(
    market: string,
    balance: string,
    request: CheckoutRequest,
  ): Promise<CheckoutSession> {
    await this.reserve(balance, request.reference, request.amount);
    return this.orRelease(balance, request.reference, () =>
      this.payments.checkout(market, request),
    );
  }

  /**
   * Reserves `request.amount` of balance `balance` for the part `request.reference`, then presents it on a terminal
   * (with a tip prompt when given; the tip is the payer's, not the balance's).
   *
   * @throws BalanceExceededError when the part does not fit in what is left, or the balance is settled.
   * @throws NotFoundError when there is no such balance.
   */
  async startTerminal(
    market: string,
    balance: string,
    request: TerminalRequest,
  ): Promise<TerminalSession> {
    await this.reserve(balance, request.reference, request.amount);
    return this.orRelease(balance, request.reference, () =>
      this.payments.startTerminal(market, request),
    );
  }

  /**
   * Reads each open part's payment (looking pending, authorised and unknown ones up at the provider), marks it paid or
   * released, and stamps the balance settled once the paid parts cover it. Running it again changes nothing.
   *
   * @throws NotFoundError when there is no such balance.
   */
  async settle(reference: string): Promise<PaymentBalance> {
    return this.balances.exclusive(reference, async () => {
      const balance = await this.load(reference);
      const parts: BalancePart[] = [];
      for (const part of balance.parts) {
        if (part.state !== "open") {
          parts.push(part);
          continue;
        }
        const found = await this.records.find(part.reference);
        const record =
          found === null || PAID.includes(found.status) || RELEASED.includes(found.status)
            ? found
            : await this.payments.reconcile(part.reference);
        parts.push({ ...part, state: stateOf(record) });
      }
      const paid = sumOf(balance.amount.currency, parts, ["paid"]);
      const settledAt =
        balance.settledAt ?? (paid.minor >= balance.amount.minor ? this.clock.now() : undefined);
      return this.save({
        ...balance,
        parts,
        ...(settledAt === undefined ? {} : { settledAt }),
      });
    });
  }

  /**
   * Under the lock, adds an open part (or re-opens a released one) when it fits.
   *
   * @throws BalanceExceededError when it does not fit, or the balance is settled.
   */
  private async reserve(reference: string, part: string, amount: Money): Promise<void> {
    await this.balances.exclusive(reference, async () => {
      const balance = await this.load(reference);
      const existing = balance.parts.find((entry) => entry.reference === part);
      if (existing !== undefined && existing.state !== "released") return;
      const left = leftOf(balance);
      if (
        balance.settledAt !== undefined ||
        amount.currency !== left.currency ||
        amount.minor <= 0 ||
        amount.minor > left.minor
      )
        throw BalanceExceededError.create({ balance: reference, part });
      const others = balance.parts.filter((entry) => entry.reference !== part);
      await this.save({
        ...balance,
        parts: [...others, { reference: part, amount, state: "open" }],
      });
    });
  }

  /**
   * Runs the part's payment call; when it throws and left no payment that may still succeed (none, failed or voided),
   * the part is released so its share is free again. An `unknown` payment keeps its share until `settle`.
   */
  private async orRelease<T>(balance: string, part: string, call: () => Promise<T>): Promise<T> {
    try {
      return await call();
    } catch (error) {
      const record = await this.records.find(part);
      if (record === null || RELEASED.includes(record.status))
        await this.balances.exclusive(balance, async () => {
          const current = await this.load(balance);
          await this.save({
            ...current,
            parts: current.parts.map((entry) =>
              entry.reference === part && entry.state === "open"
                ? { ...entry, state: "released" }
                : entry,
            ),
          });
        });
      throw error;
    }
  }

  /**
   * The balance under `reference`.
   *
   * @throws NotFoundError when there is none.
   */
  private async load(reference: string): Promise<PaymentBalance> {
    const balance = await this.balances.find(reference);
    if (balance === null) throw NotFoundError.create();
    return balance;
  }

  /** Stamps and stores `balance`, and returns it. */
  private async save(balance: PaymentBalance): Promise<PaymentBalance> {
    const stamped = { ...balance, updatedAt: this.clock.now() };
    await this.balances.save(stamped);
    return stamped;
  }
}

/**
 * The part state a payment record stands for; no record yet keeps the part open.
 * shortcut: a process that dies between the reservation and the payment call leaves an open part with no record that
 * only a new balance frees; add an expiry on reservations if that shows up in production.
 */
function stateOf(record: PaymentRecord | null): BalancePart["state"] {
  if (record === null) return "open";
  if (PAID.includes(record.status)) return "paid";
  if (RELEASED.includes(record.status)) return "released";
  return "open";
}

/** The sum of the parts in `states`. */
function sumOf(
  currency: string,
  parts: readonly BalancePart[],
  states: readonly BalancePart["state"][],
): Money {
  return parts
    .filter((part) => states.includes(part.state))
    .reduce((sum, part) => sum.plus(part.amount), Money.zero(currency));
}

/** The amount less the open and the paid parts. */
function leftOf(balance: PaymentBalance): Money {
  return balance.amount.minus(sumOf(balance.amount.currency, balance.parts, ["open", "paid"]));
}
