/**
 * Stackra file contract:
 * Purpose: `PaymentService`, the payments engine's mechanism over the gateway ports: hosted checkout and pay links,
 *          saved-token charges (refusing a merchant-initiated charge without the customer's agreement), terminal
 *          sessions with a tip prompt, capture, void and refund, and the `unknown` state: a call whose answer is
 *          lost marks the payment `unknown`, nothing may act on it until `reconcile` looks it up at the provider or
 *          a manager `resolve`s it with a reason. On a `connected-account` connection only, a payment above the
 *          pre-verification cap and a payout while payouts are held are refused; the account's enabled payment
 *          methods are read from the provider. A `restricted` tender or a PIN step on a request asks the provider
 *          for the matching capability (the restricted-tender flow itself is `RestrictedTenderService`), and so does
 *          a SoftPos session (tap to pay; the phone collects it through the `SoftPos` port). An agent's payment is
 *          taken only within what the shopper confirmed in their own wallet (`agentCheckout`): an agent never pays
 *          alone. A saved token can be pre-authorised (`preAuthorize`, a tab or a deposit), an authorised hold raised
 *          (`increment`), then captured in part or in full (`capture`) or released (`void`). A terminal cancel names
 *          the session's `providerRef` so a cloud terminal API cancels that checkout only.
 * Boundary: generic over `PaymentGateways` (which provider serves a call is the Connection's and the Market's data),
 *           `PaymentRecords` (where state lives) and `ConnectedAccountLimits` (the cap and the hold, from the OS
 *           verification record) and `AgentCommerceProtocols` (the protocols' proof of a wallet confirmation). It never
 *           names a provider, a protocol, a Market, a fee or a limit; caps,
 *           approvals and who may resolve by hand are rules and permissions in the calling product. One payment per
 *           merchant reference: a retried charge or terminal session with a used reference returns the record.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decisions 1, 2, 5 and 6); ADR 0356 (decision 2); ADR 0294 (decisions 15 to 17);
 *                     R4-6 (the cap and the hold apply to connected accounts only); R4-4 (methods from the account);
 *                     ADR 0445 (restricted tenders and the PIN step); ADR 0446 (agent payments and SoftPos);
 *                     STA-1024 (pre-authorisation and incremental authorisation).
 */
import { Service } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import { NotFoundError } from "@stackra/errors";
import { Money } from "@stackra/money";

import { ChargeInitiator } from "#contracts/enums/charge-initiator.enum";
import { ConnectionMode } from "#contracts/enums/connection-mode.enum";
import { PaymentCapability } from "#contracts/enums/payment-capability.enum";
import { PaymentStatus } from "#contracts/enums/payment-status.enum";
import { TenderKind } from "#contracts/enums/tender-kind.enum";
import { TransferStatus } from "#contracts/enums/transfer-status.enum";
import type { AgentCommerceProtocols } from "#contracts/ports/agent-commerce-protocols.port";
import type { ConnectedAccountLimits } from "#contracts/ports/connected-account-limits.port";
import type { PaymentGateways } from "#contracts/ports/payment-gateways.port";
import type { PaymentRecords } from "#contracts/ports/payment-records.port";
import type { AgentCheckoutRequest } from "#contracts/types/agent-checkout-request.type";
import type { PaymentCapabilityGateways } from "#contracts/types/payment-capability-gateways.type";
import type { CheckoutRequest } from "#contracts/types/checkout-request.type";
import type { CheckoutSession } from "#contracts/types/checkout-session.type";
import type { IncrementRequest } from "#contracts/types/increment-request.type";
import type { PayLink } from "#contracts/types/pay-link.type";
import type { PaymentGateway } from "#contracts/types/payment-gateway.type";
import type { PaymentRecord } from "#contracts/types/payment-record.type";
import type { PaymentTarget } from "#contracts/types/payment-target.type";
import type { PayoutRequest } from "#contracts/types/payout-request.type";
import type { ProviderPayment } from "#contracts/types/provider-payment.type";
import type { TerminalRequest } from "#contracts/types/terminal-request.type";
import type { TerminalSession } from "#contracts/types/terminal-session.type";
import type { TokenCharge } from "#contracts/types/token-charge.type";
import type { TransferResult } from "#contracts/types/transfer-result.type";
import { AgentConfirmationRefusedError } from "#core/errors/agent-confirmation-refused.error";
import { CapabilityUnsupportedError } from "#core/errors/capability-unsupported.error";
import { InvalidPaymentTransitionError } from "#core/errors/invalid-payment-transition.error";
import { MerchantInitiatedNotAllowedError } from "#core/errors/merchant-initiated-not-allowed.error";
import { PaymentUnknownError } from "#core/errors/payment-unknown.error";
import { PayoutHeldError } from "#core/errors/payout-held.error";
import { PreVerificationCapExceededError } from "#core/errors/pre-verification-cap-exceeded.error";
import { ResolutionReasonRequiredError } from "#core/errors/resolution-reason-required.error";
import { hasPaymentCapability } from "#core/functions/has-payment-capability.function";
import { isLostAnswer } from "#core/functions/is-lost-answer.function";
import { modeOf } from "#core/functions/mode-of.function";
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

  /** The cap and the payout hold of a connected account. */
  private readonly limits: ConnectedAccountLimits;

  /** The agent protocols' wallet confirmations; none bound means no agent payment is taken. */
  private readonly agents: AgentCommerceProtocols | undefined;

  /**
   * @param gateways - the `connection` driver in a host; a fake in tests.
   * @param records - the host's durable store; the memory driver in tests.
   * @param clock - the container's clock.
   * @param limits - the host's verification-backed limits; a fake in tests.
   * @param agents - the host's protocol connectors; gen's wiring always passes it, a test may leave it out.
   */
  constructor(
    gateways: PaymentGateways,
    records: PaymentRecords,
    clock: Clock,
    limits: ConnectedAccountLimits,
    agents?: AgentCommerceProtocols,
  ) {
    super();
    this.gateways = gateways;
    this.records = records;
    this.clock = clock;
    this.limits = limits;
    this.agents = agents;
  }

  /**
   * Opens a hosted checkout for `request` with a provider of `market`. A reference whose checkout is still open and
   * unexpired gets the same session back; one that failed or was voided gets a new one.
   *
   * @throws PaymentUnknownError when the reference's last answer was lost (and when this one is).
   * @throws InvalidPaymentTransitionError when the reference is already paid, held or in use otherwise.
   * @throws NoPaymentProviderError when no provider of the Market serves the request's needs.
   * @throws PreVerificationCapExceededError when an unverified connected account would take more than its cap.
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
      ...(request.tender === TenderKind.Restricted ? [PaymentCapability.RestrictedTender] : []),
    ]);
    await this.withinCap(gateway, request.reference, totalOf(request));
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
   * @throws PreVerificationCapExceededError when an unverified connected account would take more than its cap.
   */
  async charge(request: TokenCharge): Promise<PaymentRecord> {
    return this.onToken(request, PaymentCapability.Tokens, (tokens) => tokens.charge(request));
  }

  /**
   * Holds `request.amount` on a saved token without taking it (a tab on a card, a deposit): the record is
   * `authorized` once the issuer approves, then `increment`, `capture` (in part or in full) or `void` (release) it.
   * Same rules as `charge`: the merchant-initiated flag, one payment per reference, the connected-account cap.
   *
   * @throws MerchantInitiatedNotAllowedError when the merchant starts a hold the customer did not agree to.
   * @throws CapabilityUnsupportedError when the token's provider cannot pre-authorise.
   * @throws PaymentUnknownError when the reference's last answer was lost (and when this one is).
   * @throws PreVerificationCapExceededError when an unverified connected account would hold more than its cap.
   */
  async preAuthorize(request: TokenCharge): Promise<PaymentRecord> {
    return this.onToken(request, PaymentCapability.PreAuth, (holds) => holds.authorize(request));
  }

  /**
   * Raises the hold of an authorised payment by `amount` under `incrementReference` (its idempotency key at the
   * provider), as a tab grows. The record's amount becomes what the provider now holds, so a retried increment the
   * provider already applied is not counted twice.
   *
   * @throws InvalidPaymentTransitionError when the payment is not authorised or `amount` is not positive.
   * @throws CapabilityUnsupportedError when its provider cannot raise a hold.
   * @throws PaymentUnknownError when its last answer was lost (and when this one is).
   * @throws PreVerificationCapExceededError when an unverified connected account would hold more than its cap.
   */
  async increment(
    reference: string,
    amount: Money,
    incrementReference: string,
  ): Promise<PaymentRecord> {
    const record = await this.load(reference);
    this.assert(record, "increment", [PaymentStatus.Authorized]);
    if (amount.minor <= 0 || amount.currency !== record.amount.currency)
      throw InvalidPaymentTransitionError.create({
        reference,
        status: record.status,
        operation: "increment",
      });
    const gateway = await this.gateways.byConnection(record.provider, record.connectionId);
    const raiser = this.capable(gateway, PaymentCapability.IncrementalAuth);
    await this.withinCap(gateway, reference, totalOf(record).plus(amount));
    const request: IncrementRequest = {
      payment: this.targetOf(record),
      amount,
      reference: incrementReference,
    };
    const result = await this.guard(record, () => raiser.increment(request), false);
    return this.save({
      ...record,
      providerRef: result.providerRef,
      status: result.status,
      amount: record.tip === undefined ? result.amount : result.amount.minus(record.tip),
    });
  }

  /**
   * Takes an agent's payment for a cart the shopper confirmed in their own wallet: the protocol's proof must verify,
   * name this reference, be unexpired and cover the amount in its currency. The wallet's token is then charged as a
   * customer-initiated charge on the connection that made it, and the record keeps the protocol and agent. A retry
   * with the same reference returns the record, so the cart is never paid twice.
   *
   * @throws AgentConfirmationRefusedError when there is no such confirmation (`missing`), it is for another cart
   *         (`reference`), it has expired (`expired`) or it does not cover the amount (`amount`).
   * @throws PaymentUnknownError when the reference's last answer was lost (and when this one is).
   * @throws PreVerificationCapExceededError when an unverified connected account would take more than its cap.
   */
  async agentCheckout(request: AgentCheckoutRequest): Promise<PaymentRecord> {
    const confirmation = (await this.agents?.confirmation(request.protocol, request.proof)) ?? null;
    if (confirmation === null) throw this.agentRefusal(request, "missing");
    if (confirmation.reference !== request.reference) throw this.agentRefusal(request, "reference");
    if (this.clock.now() >= confirmation.expiresAt) throw this.agentRefusal(request, "expired");
    if (
      request.amount.currency !== confirmation.amount.currency ||
      request.amount.minor > confirmation.amount.minor
    )
      throw this.agentRefusal(request, "amount");
    const record = await this.charge({
      reference: request.reference,
      method: confirmation.method,
      amount: request.amount,
      initiator: ChargeInitiator.Customer,
      ...(request.description === undefined ? {} : { description: request.description }),
    });
    if (record.agent !== undefined) return record;
    return this.save({
      ...record,
      agent: { protocol: confirmation.protocol, agent: confirmation.agent },
    });
  }

  /**
   * Presents `request.amount` on a terminal of a provider of `market`, with a tip prompt when given, a PIN step,
   * a restricted tender and a SoftPos (tap to pay) session when the request asks (the provider must have the matching
   * capability).
   *
   * @throws PaymentUnknownError when the reference's last answer was lost (and when this one is).
   * @throws InvalidPaymentTransitionError when the reference is in use.
   * @throws PreVerificationCapExceededError when an unverified connected account would take more than its cap.
   */
  async startTerminal(market: string, request: TerminalRequest): Promise<TerminalSession> {
    const existing = await this.records.find(request.reference);
    if (existing !== null) this.assert(existing, "start_terminal", REOPENABLE);
    const gateway = await this.gateways.forMarket(market, [
      PaymentCapability.Terminal,
      ...(request.tipPrompt === undefined ? [] : [PaymentCapability.TerminalTips]),
      ...(request.captureLater === true ? [PaymentCapability.Capture] : []),
      ...(request.tender === TenderKind.Restricted ? [PaymentCapability.RestrictedTender] : []),
      ...(request.pinEntry === true ? [PaymentCapability.TerminalPin] : []),
      ...(request.softPos === true ? [PaymentCapability.SoftPos] : []),
    ]);
    const terminal = this.capable(gateway, PaymentCapability.Terminal);
    await this.withinCap(gateway, request.reference, request.amount);
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
    const { terminalId, providerRef } = record;
    const gateway = await this.gateways.byConnection(record.provider, record.connectionId);
    const terminal = this.capable(gateway, PaymentCapability.Terminal);
    await this.guard(record, () => terminal.cancelTerminal(terminalId, providerRef), false);
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
   * Captures an authorised payment, in full unless `amount` says less (a pre-authorised tab captures what was spent).
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
   * Releases an authorised payment (a pre-authorisation nobody spent), or closes a checkout nobody has paid.
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
   * Pays `request.amount` out of the funds of connection `connectionId` of `provider`. A `connected-account`
   * connection whose payouts are held is refused; no other mode is ever held.
   *
   * @throws PayoutHeldError when the connected account's payouts are held.
   * @throws CapabilityUnsupportedError when the provider has no payouts.
   */
  async payout(
    provider: string,
    connectionId: string,
    request: PayoutRequest,
  ): Promise<TransferResult> {
    const gateway = await this.gateways.byConnection(provider, connectionId);
    const payouts = this.capable(gateway, PaymentCapability.Payouts);
    if (
      modeOf(gateway) === ConnectionMode.ConnectedAccount &&
      (await this.limits.payoutHeld(gateway.id))
    )
      throw PayoutHeldError.create({ reference: request.reference });
    return payouts.payout(request);
  }

  /**
   * The payment methods the account that serves `market` has enabled (wallets, pay-later, bank methods), read from
   * the provider.
   *
   * @returns null when the provider does not report them: its hosted page shows what it has.
   * @throws NoPaymentProviderError when no provider of the Market takes checkouts.
   */
  async paymentMethods(market: string): Promise<readonly string[] | null> {
    const gateway = await this.gateways.forMarket(market, [PaymentCapability.Checkout]);
    return hasPaymentCapability(gateway, PaymentCapability.Methods) ? gateway.paymentMethods() : null;
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
   * A payment on a saved token through the port of `capability` (a charge or a hold). A merchant-initiated one needs
   * the token's flag; a reference already used returns its record, so a retry never charges or holds twice.
   *
   * @throws MerchantInitiatedNotAllowedError when the merchant starts it without the customer's agreement.
   * @throws PaymentUnknownError when the reference's last answer was lost (and when this one is).
   */
  private async onToken<K extends "tokens" | "pre_auth">(
    request: TokenCharge,
    capability: K,
    call: (gateway: PaymentCapabilityGateways[K]) => Promise<ProviderPayment>,
  ): Promise<PaymentRecord> {
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
    const port = this.capable(gateway, capability);
    await this.withinCap(gateway, request.reference, request.amount);
    const record = await this.save(this.fresh(gateway, request.reference, request.amount));
    const result = await this.guard(record, () => call(port), true);
    return this.save({ ...record, providerRef: result.providerRef, status: result.status });
  }

  /** The refusal of an agent payment for `reason`. */
  private agentRefusal(
    request: AgentCheckoutRequest,
    reason: string,
  ): AgentConfirmationRefusedError {
    return AgentConfirmationRefusedError.create({
      reference: request.reference,
      protocol: request.protocol,
      reason,
    });
  }

  /**
   * Refuses `amount` on an unverified `connected-account` connection above its cap; any other mode has no cap.
   *
   * @throws PreVerificationCapExceededError when the amount is above the cap.
   */
  private async withinCap(
    gateway: PaymentGateway,
    reference: string,
    amount: Money,
  ): Promise<void> {
    if (modeOf(gateway) !== ConnectionMode.ConnectedAccount) return;
    const cap = await this.limits.cap(gateway.id);
    if (cap !== null && (amount.currency !== cap.currency || amount.minor > cap.minor))
      throw PreVerificationCapExceededError.create({ reference });
  }

  /**
   * `gateway` as the port of `capability`.
   *
   * @throws CapabilityUnsupportedError when its driver lacks it.
   */
  private capable<K extends PaymentCapability>(
    gateway: PaymentGateway,
    capability: K,
  ): PaymentGateway & PaymentCapabilityGateways[K] {
    if (hasPaymentCapability(gateway, capability)) return gateway;
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
