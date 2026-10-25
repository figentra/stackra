/**
 * Stackra file contract:
 * Purpose: `PaymentService`, the payments engine's mechanism over the gateway ports: hosted checkout and pay links,
 *          saved-token charges (refusing a merchant-initiated charge without the customer's agreement), terminal
 *          sessions with a tip prompt, capture, void and refund, and the `unknown` state: a call whose answer is
 *          lost marks the payment `unknown`, nothing may act on it until `reconcile` looks it up at the provider or
 *          a manager `resolve`s it with a reason.
 * Boundary: generic over `PaymentGateways` (which provider serves a call is the Connection's and the Market's data)
 *           and `PaymentRecords` (where state lives). It never names a provider, a Market, a fee or a limit; caps,
 *           approvals and who may resolve by hand are rules and permissions in the calling product. One payment per
 *           merchant reference: a retried charge or terminal session with a used reference returns the record.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decisions 1, 2, 5 and 6); ADR 0356 (decision 2); ADR 0294 (decisions 15 to 17).
 */
import { Service } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import { NotFoundError } from "@stackra/errors";
import { Money } from "@stackra/money";

import { ChargeInitiator } from "#contracts/enums/charge-initiator.enum";
import { PaymentCapability } from "#contracts/enums/payment-capability.enum";
import { PaymentStatus } from "#contracts/enums/payment-status.enum";
import { TransferStatus } from "#contracts/enums/transfer-status.enum";
import type { PaymentGateways } from "#contracts/ports/payment-gateways.port";
import type { PaymentRecords } from "#contracts/ports/payment-records.port";
import type { CapabilityGateways } from "#contracts/types/capability-gateways.type";
import type { CheckoutRequest } from "#contracts/types/checkout-request.type";
import type { CheckoutSession } from "#contracts/types/checkout-session.type";
import type { PayLink } from "#contracts/types/pay-link.type";
import type { PaymentGateway } from "#contracts/types/payment-gateway.type";
import type { PaymentRecord } from "#contracts/types/payment-record.type";
import type { PaymentTarget } from "#contracts/types/payment-target.type";
import type { TerminalRequest } from "#contracts/types/terminal-request.type";
import type { TerminalSession } from "#contracts/types/terminal-session.type";
import type { TokenCharge } from "#contracts/types/token-charge.type";
import type { TransferResult } from "#contracts/types/transfer-result.type";
import { CapabilityUnsupportedError } from "#core/errors/capability-unsupported.error";
import { InvalidPaymentTransitionError } from "#core/errors/invalid-payment-transition.error";
import { MerchantInitiatedNotAllowedError } from "#core/errors/merchant-initiated-not-allowed.error";
import { PaymentUnknownError } from "#core/errors/payment-unknown.error";
import { ResolutionReasonRequiredError } from "#core/errors/resolution-reason-required.error";
import { hasCapability } from "#core/functions/has-capability.function";
import { isLostAnswer } from "#core/functions/is-lost-answer.function";
import { totalOf } from "#core/functions/total-of.function";

/** States a manager may settle an `unknown` payment to. */
const RESOLVABLE: readonly PaymentStatus[] = [
  PaymentStatus.Authorized,
  PaymentStatus.Captured,
  PaymentStatus.Failed,
  PaymentStatus.Voided,
];

/** States after which a new checkout or terminal session may reuse the reference. */
const REOPENABLE: readonly PaymentStatus[] = [PaymentStatus.Failed, PaymentStatus.Voided];

/**
 * The engine's public service. Inject it by class.
 *
 * @example
 * const session = await payments.checkout(market, { reference, amount, description, returnUrl, cancelUrl });
 * // later, from the return page or a webhook
 * const record = await payments.reconcile(reference);
 */
export class PaymentService extends Service {
  /** Which gateway serves a call. */
  private readonly gateways: PaymentGateways;

  /** The engine's payment state. */
  private readonly records: PaymentRecords;

  /** The time a record changes. */
  private readonly clock: Clock;

  /**
   * @param gateways - the `connection` driver in a host; a fake in tests.
   * @param records - the host's durable store; the memory driver in tests.
   * @param clock - the container's clock.
   */
  constructor(gateways: PaymentGateways, records: PaymentRecords, clock: Clock) {
    super();
    this.gateways = gateways;
    this.records = records;
    this.clock = clock;
  }

  /**
   * Opens a hosted checkout for `request` with a provider of `market`. A reference whose checkout is still open and
   * unexpired gets the same session back; one that failed or was voided gets a new one.
   *
   * @throws PaymentUnknownError when the reference's last answer was lost (and when this one is).
   * @throws InvalidPaymentTransitionError when the reference is already paid, held or in use otherwise.
   * @throws NoPaymentProviderError when no provider of the Market serves the request's needs.
   */
  async checkout(market: string, request: CheckoutRequest): Promise<CheckoutSession> {
    const existing = await this.records.find(request.reference);
    if (existing !== null) {
      const open = await this.stillOpen(existing);
      if (open !== undefined) return open;
    }
    const gateway = await this.gateways.forMarket(market, [
      PaymentCapability.Checkout,
      ...(request.captureLater === true ? [PaymentCapability.Capture] : []),
      ...(request.platform === undefined ? [] : [PaymentCapability.Platform]),
    ]);
    const record = await this.save(
      this.fresh(gateway, request.reference, request.amount, request.tip),
    );
    const session = await this.guard(record, () => gateway.checkout(request), true);
    await this.save({ ...record, providerRef: session.providerRef, session });
    return session;
  }

  /**
   * A pay link: a checkout that expires at `request.expiresAt`, sent to the customer by the product. Sending it again
   * before it expires returns the same link.
   *
   * @throws InvalidPaymentTransitionError when the reference is already paid.
   */
  async payLink(
    market: string,
    request: CheckoutRequest & { readonly expiresAt: Date },
  ): Promise<PayLink> {
    const session = await this.checkout(market, request);
    return {
      reference: request.reference,
      url: session.url,
      expiresAt: session.expiresAt ?? request.expiresAt,
    };
  }

  /**
   * Charges a saved token on the connection that made it. A merchant-initiated charge needs the token's flag. A
   * reference already charged returns its record, so a retry never charges twice.
   *
   * @throws MerchantInitiatedNotAllowedError when the merchant starts a charge the customer did not agree to.
   * @throws PaymentUnknownError when the reference's last answer was lost (and when this one is).
   */
  async charge(request: TokenCharge): Promise<PaymentRecord> {
    if (request.initiator === ChargeInitiator.Merchant && !request.method.merchantInitiated)
      throw MerchantInitiatedNotAllowedError.create({ reference: request.reference });
    const existing = await this.records.find(request.reference);
    if (existing !== null) {
      if (existing.status === PaymentStatus.Unknown)
        throw PaymentUnknownError.create({ reference: existing.reference });
      return existing;
    }
    const gateway = await this.gateways.byConnection(
      request.method.provider,
      request.method.connectionId,
    );
    const tokens = this.capable(gateway, PaymentCapability.Tokens);
    const record = await this.save(this.fresh(gateway, request.reference, request.amount));
    const result = await this.guard(record, () => tokens.charge(request), true);
    return this.save({ ...record, providerRef: result.providerRef, status: result.status });
  }

  /**
   * Presents `request.amount` on a terminal of a provider of `market`, with a tip prompt when given.
   *
   * @throws PaymentUnknownError when the reference's last answer was lost (and when this one is).
   * @throws InvalidPaymentTransitionError when the reference is in use.
   */
  async startTerminal(market: string, request: TerminalRequest): Promise<TerminalSession> {
    const existing = await this.records.find(request.reference);
    if (existing !== null) this.assert(existing, "start_terminal", REOPENABLE);
    const gateway = await this.gateways.forMarket(market, [
      PaymentCapability.Terminal,
      ...(request.tipPrompt === undefined ? [] : [PaymentCapability.TerminalTips]),
      ...(request.captureLater === true ? [PaymentCapability.Capture] : []),
    ]);
    const terminal = this.capable(gateway, PaymentCapability.Terminal);
    const record = await this.save({
      ...this.fresh(gateway, request.reference, request.amount),
      terminalId: request.terminalId,
    });
    const session = await this.guard(record, () => terminal.startTerminal(request), true);
    await this.save({ ...record, providerRef: session.providerRef, status: session.status });
    return session;
  }

  /**
   * Clears the terminal of a pending terminal payment, then reads where the payment ended up (the customer may have
   * paid in the meantime).
   */
  async cancelTerminal(reference: string): Promise<PaymentRecord> {
    const record = await this.load(reference);
    this.assert(record, "cancel_terminal", [PaymentStatus.Pending]);
    if (record.terminalId === undefined)
      throw InvalidPaymentTransitionError.create({
        reference,
        status: record.status,
        operation: "cancel_terminal",
      });
    const terminalId = record.terminalId;
    const gateway = await this.gateways.byConnection(record.provider, record.connectionId);
    const terminal = this.capable(gateway, PaymentCapability.Terminal);
    await this.guard(record, () => terminal.cancelTerminal(terminalId), false);
    return this.reconcile(reference);
  }

  /**
   * Looks the payment up at its provider and records what the provider says: the only way out of `unknown` other than
   * a manual resolution. A payment the provider holds nothing for is `failed` when it was `unknown`.
   *
   * @throws NotFoundError when the reference has no record.
   */
  async reconcile(reference: string): Promise<PaymentRecord> {
    const record = await this.load(reference);
    const gateway = await this.gateways.byConnection(record.provider, record.connectionId);
    const found = await gateway.lookup(this.targetOf(record));
    if (found === null)
      return record.status === PaymentStatus.Unknown
        ? this.save({ ...record, status: PaymentStatus.Failed })
        : record;
    return this.save({
      ...record,
      providerRef: found.providerRef,
      status: found.status,
      ...(found.tip === undefined ? {} : { tip: found.tip }),
      ...(found.method === undefined ? {} : { method: found.method }),
    });
  }

  /**
   * Captures an authorised payment, in full unless `amount` says less.
   *
   * @throws PaymentUnknownError when its last answer was lost (and when this one is).
   * @throws CapabilityUnsupportedError when its provider takes payment at once.
   */
  async capture(reference: string, amount?: Money): Promise<PaymentRecord> {
    const record = await this.load(reference);
    this.assert(record, "capture", [PaymentStatus.Authorized]);
    const gateway = await this.gateways.byConnection(record.provider, record.connectionId);
    const capturer = this.capable(gateway, PaymentCapability.Capture);
    const result = await this.guard(
      record,
      () =>
        capturer.capture({
          payment: this.targetOf(record),
          amount: amount ?? totalOf(record),
          reference: `capture:${reference}`,
        }),
      false,
    );
    return this.save({ ...record, providerRef: result.providerRef, status: result.status });
  }

  /**
   * Releases an authorised payment, or closes a checkout nobody has paid.
   *
   * @throws PaymentUnknownError when its last answer was lost (and when this one is).
   */
  async void(reference: string): Promise<PaymentRecord> {
    const record = await this.load(reference);
    this.assert(record, "void", [PaymentStatus.Pending, PaymentStatus.Authorized]);
    const gateway = await this.gateways.byConnection(record.provider, record.connectionId);
    const voider = this.capable(gateway, PaymentCapability.Capture);
    const result = await this.guard(record, () => voider.void(this.targetOf(record)), false);
    return this.save({ ...record, providerRef: result.providerRef, status: result.status });
  }

  /**
   * Refunds `amount` of a captured payment under `refundReference` (its idempotency key).
   *
   * @throws InvalidPaymentTransitionError when the payment is not captured or `amount` exceeds what is left.
   * @throws PaymentUnknownError when its last answer was lost (and when this one is).
   */
  async refund(
    reference: string,
    amount: Money,
    refundReference: string,
    reason?: string,
  ): Promise<TransferResult> {
    const record = await this.load(reference);
    this.assert(record, "refund", [PaymentStatus.Captured, PaymentStatus.PartiallyRefunded]);
    const total = totalOf(record);
    const refunded = record.refunded.plus(amount);
    if (amount.minor <= 0 || refunded.minor > total.minor)
      throw InvalidPaymentTransitionError.create({
        reference,
        status: record.status,
        operation: "refund",
      });
    const gateway = await this.gateways.byConnection(record.provider, record.connectionId);
    const result = await this.guard(
      record,
      () =>
        gateway.refund({
          payment: this.targetOf(record),
          amount,
          reference: refundReference,
          ...(reason === undefined ? {} : { reason }),
        }),
      false,
    );
    if (result.status !== TransferStatus.Failed)
      await this.save({
        ...record,
        refunded,
        status:
          refunded.minor >= total.minor ? PaymentStatus.Refunded : PaymentStatus.PartiallyRefunded,
      });
    return result;
  }

  /**
   * Settles an `unknown` payment by hand, recording who and why. Who may call it is the product's permission.
   *
   * @throws InvalidPaymentTransitionError when the payment is not `unknown`, or `status` is not a settled state.
   * @throws ResolutionReasonRequiredError when `reason` is blank.
   */
  async resolve(
    reference: string,
    status: PaymentStatus,
    resolution: { readonly by: string; readonly reason: string },
  ): Promise<PaymentRecord> {
    const record = await this.load(reference);
    if (record.status !== PaymentStatus.Unknown || !RESOLVABLE.includes(status))
      throw InvalidPaymentTransitionError.create({
        reference,
        status: record.status,
        operation: "resolve",
      });
    const reason = resolution.reason.trim();
    if (reason === "") throw ResolutionReasonRequiredError.create({ reference });
    return this.save({
      ...record,
      status,
      resolution: { by: resolution.by, reason, at: this.clock.now() },
    });
  }

  /**
   * The open session of `record` when it may be handed out again, or undefined when a new one may be opened.
   *
   * @throws PaymentUnknownError / InvalidPaymentTransitionError when the reference may not take a new checkout.
   */
  private async stillOpen(record: PaymentRecord): Promise<CheckoutSession | undefined> {
    if (REOPENABLE.includes(record.status)) return undefined;
    this.assert(record, "checkout", [PaymentStatus.Pending]);
    if (record.session === undefined)
      throw InvalidPaymentTransitionError.create({
        reference: record.reference,
        status: record.status,
        operation: "checkout",
      });
    const now = this.clock.now();
    const current = await this.reconcile(record.reference);
    if (REOPENABLE.includes(current.status)) return undefined;
    if (current.status !== PaymentStatus.Pending)
      throw InvalidPaymentTransitionError.create({
        reference: record.reference,
        status: current.status,
        operation: "checkout",
      });
    const expiresAt = record.session.expiresAt;
    return expiresAt === undefined || expiresAt > now ? record.session : undefined;
  }

  /**
   * Refuses an operation on a payment that is `unknown` or not in `allowed`.
   *
   * @throws PaymentUnknownError when the payment is `unknown`: look it up first.
   * @throws InvalidPaymentTransitionError when its state does not allow `operation`.
   */
  private assert(
    record: PaymentRecord,
    operation: string,
    allowed: readonly PaymentStatus[],
  ): void {
    if (record.status === PaymentStatus.Unknown)
      throw PaymentUnknownError.create({ reference: record.reference });
    if (!allowed.includes(record.status))
      throw InvalidPaymentTransitionError.create({
        reference: record.reference,
        status: record.status,
        operation,
      });
  }

  /**
   * `gateway` as the port of `capability`.
   *
   * @throws CapabilityUnsupportedError when its driver lacks it.
   */
  private capable<K extends PaymentCapability>(
    gateway: PaymentGateway,
    capability: K,
  ): PaymentGateway & CapabilityGateways[K] {
    if (hasCapability(gateway, capability)) return gateway;
    throw CapabilityUnsupportedError.create({ provider: gateway.provider, capability });
  }

  /**
   * Runs a provider call. A lost answer marks the payment `unknown` and throws `PaymentUnknownError`; any other error
   * marks it `failed` when `creates` (nothing was made at the provider) and is rethrown.
   */
  private async guard<T>(
    record: PaymentRecord,
    call: () => Promise<T>,
    creates: boolean,
  ): Promise<T> {
    try {
      return await call();
    } catch (error) {
      if (isLostAnswer(error)) {
        await this.save({ ...record, status: PaymentStatus.Unknown });
        throw PaymentUnknownError.create({ reference: record.reference }, { cause: error });
      }
      if (creates) await this.save({ ...record, status: PaymentStatus.Failed });
      throw error;
    }
  }

  /**
   * The record under `reference`.
   *
   * @throws NotFoundError when there is none.
   */
  private async load(reference: string): Promise<PaymentRecord> {
    const record = await this.records.find(reference);
    if (record === null) throw NotFoundError.create();
    return record;
  }

  /** A new pending record of `gateway` for `reference`. */
  private fresh(
    gateway: PaymentGateway,
    reference: string,
    amount: Money,
    tip?: Money,
  ): PaymentRecord {
    return {
      reference,
      provider: gateway.provider,
      connectionId: gateway.id,
      amount,
      ...(tip === undefined ? {} : { tip }),
      refunded: Money.zero(amount.currency),
      status: PaymentStatus.Pending,
      updatedAt: this.clock.now(),
    };
  }

  /** The record as a lookup target. */
  private targetOf(record: PaymentRecord): PaymentTarget {
    return {
      reference: record.reference,
      ...(record.providerRef === undefined ? {} : { providerRef: record.providerRef }),
    };
  }

  /** Stamps and stores `record`, and returns it. */
  private async save(record: PaymentRecord): Promise<PaymentRecord> {
    const stamped = { ...record, updatedAt: this.clock.now() };
    await this.records.save(stamped);
    return stamped;
  }
}
