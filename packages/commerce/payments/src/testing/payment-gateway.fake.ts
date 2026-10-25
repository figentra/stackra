/**
 * Stackra file contract:
 * Purpose: `PaymentGatewayFake`, an in-memory provider for tests: it implements every gateway port, lets a test act as
 *          the customer (`settle`), and can lose the answer of its next calls (`loseNext`) after acting, which is
 *          exactly the case the `unknown` state exists for.
 * Boundary: test support from `./testing`; never bound in production. A lost answer throws the managed client's
 *           `ProviderUnavailableError`, so the engine sees what a real driver would raise.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (fakes in ./testing); ADR 0357 (decisions 2 and 6).
 */
import { ProviderUnavailableError } from "@stackra/integrations";
import type { Money } from "@stackra/money";

import { DisputeStatus } from "#contracts/enums/dispute-status.enum";
import { PaymentCapability } from "#contracts/enums/payment-capability.enum";
import { PaymentStatus } from "#contracts/enums/payment-status.enum";
import { SessionKind } from "#contracts/enums/session-kind.enum";
import { TransferStatus } from "#contracts/enums/transfer-status.enum";
import type { CaptureGateway } from "#contracts/types/capture-gateway.type";
import type { CaptureRequest } from "#contracts/types/capture-request.type";
import type { CheckoutRequest } from "#contracts/types/checkout-request.type";
import type { CheckoutSession } from "#contracts/types/checkout-session.type";
import type { Dispute } from "#contracts/types/dispute.type";
import type { DisputeGateway } from "#contracts/types/dispute-gateway.type";
import type { MerchantAccount } from "#contracts/types/merchant-account.type";
import type { MerchantOnboarding } from "#contracts/types/merchant-onboarding.type";
import type { PaymentGateway } from "#contracts/types/payment-gateway.type";
import type { PaymentTarget } from "#contracts/types/payment-target.type";
import type { PayoutGateway } from "#contracts/types/payout-gateway.type";
import type { PayoutRequest } from "#contracts/types/payout-request.type";
import type { PlatformGateway } from "#contracts/types/platform-gateway.type";
import type { ProviderPayment } from "#contracts/types/provider-payment.type";
import type { RefundRequest } from "#contracts/types/refund-request.type";
import type { TerminalGateway } from "#contracts/types/terminal-gateway.type";
import type { TerminalRequest } from "#contracts/types/terminal-request.type";
import type { TerminalSession } from "#contracts/types/terminal-session.type";
import type { TokenCharge } from "#contracts/types/token-charge.type";
import type { TokenGateway } from "#contracts/types/token-gateway.type";
import type { TransferResult } from "#contracts/types/transfer-result.type";

/** One payment the fake holds, with the merchant's reference beside it. */
interface Held {
  readonly reference: string;
  readonly payment: ProviderPayment;
  readonly terminalId?: string;
}

/** Every capability, the fake's default. */
const ALL = Object.values(PaymentCapability);

/**
 * A provider in a Map.
 *
 * @example
 * const gateway = PaymentGatewayFake.with({ capabilities: [PaymentCapability.Capture] });
 * gateway.loseNext(); // the next call acts, then its answer is lost
 */
export class PaymentGatewayFake
  implements
    PaymentGateway,
    CaptureGateway,
    TokenGateway,
    PayoutGateway,
    PlatformGateway,
    DisputeGateway,
    TerminalGateway
{
  /** The connection id. */
  readonly id: string;

  /** The provider code. */
  readonly provider: string;

  /** What the fake says it can do. */
  readonly capabilities: readonly PaymentCapability[];

  /** Payments by provider id. */
  private readonly held = new Map<string, Held>();

  /** Disputes by provider id. */
  private readonly disputes = new Map<string, Dispute>();

  /** Connected merchant accounts by id. */
  private readonly accounts = new Map<string, MerchantAccount>();

  /** Answers still to lose. */
  private lost = 0;

  private constructor(id: string, provider: string, capabilities: readonly PaymentCapability[]) {
    this.id = id;
    this.provider = provider;
    this.capabilities = capabilities;
  }

  /** A fake with every capability unless `options.capabilities` narrows it. */
  static with(
    options: {
      readonly id?: string;
      readonly provider?: string;
      readonly capabilities?: readonly PaymentCapability[];
    } = {},
  ): PaymentGatewayFake {
    return new PaymentGatewayFake(
      options.id ?? "conn_fake",
      options.provider ?? "fake",
      options.capabilities ?? ALL,
    );
  }

  /** The next `count` calls act at the "provider" and then throw `ProviderUnavailableError`. */
  loseNext(count = 1): this {
    this.lost = count;
    return this;
  }

  /** Moves a payment as the customer or the issuer would (pays, abandons, adds a tip on the terminal). */
  settle(providerRef: string, status: PaymentStatus, tip?: Money): void {
    const held = this.get(providerRef);
    this.held.set(providerRef, {
      ...held,
      payment: {
        ...held.payment,
        status,
        ...(tip === undefined ? {} : { tip, amount: held.payment.amount.plus(tip) }),
      },
    });
  }

  /** Opens a dispute on a payment, as an issuer would. */
  openDispute(providerRef: string, paymentRef: string): Dispute {
    const dispute: Dispute = {
      providerRef,
      paymentRef,
      amount: this.get(paymentRef).payment.amount,
      reason: "fraudulent",
      status: DisputeStatus.NeedsResponse,
    };
    this.disputes.set(providerRef, dispute);
    return dispute;
  }

  async checkout(request: CheckoutRequest): Promise<CheckoutSession> {
    const providerRef = `fake_${request.reference}`;
    const amount = request.tip === undefined ? request.amount : request.amount.plus(request.tip);
    this.put(request.reference, { providerRef, status: PaymentStatus.Pending, amount });
    return this.answer({
      providerRef,
      kind: SessionKind.Redirect,
      url: `https://pay.example/${providerRef}`,
      ...(request.expiresAt === undefined ? {} : { expiresAt: request.expiresAt }),
    });
  }

  async lookup(target: PaymentTarget): Promise<ProviderPayment | null> {
    const held =
      (target.providerRef === undefined ? undefined : this.held.get(target.providerRef)) ??
      [...this.held.values()].find((entry) => entry.reference === target.reference);
    return held?.payment ?? null;
  }

  async refund(request: RefundRequest): Promise<TransferResult> {
    const held = this.find(request.payment);
    const refunded = held.payment.amount.minor === request.amount.minor;
    this.put(held.reference, {
      ...held.payment,
      status: refunded ? PaymentStatus.Refunded : PaymentStatus.PartiallyRefunded,
    });
    return this.answer({
      providerRef: `rfd_${request.reference}`,
      status: TransferStatus.Succeeded,
    });
  }

  async capture(request: CaptureRequest): Promise<ProviderPayment> {
    const held = this.find(request.payment);
    return this.answer(
      this.put(held.reference, { ...held.payment, status: PaymentStatus.Captured }),
    );
  }

  async void(target: PaymentTarget): Promise<ProviderPayment> {
    const held = this.find(target);
    return this.answer(this.put(held.reference, { ...held.payment, status: PaymentStatus.Voided }));
  }

  async charge(request: TokenCharge): Promise<ProviderPayment> {
    const payment = this.put(request.reference, {
      providerRef: `fake_${request.reference}`,
      status: PaymentStatus.Captured,
      amount: request.amount,
      method: request.method,
    });
    return this.answer(payment);
  }

  async payout(request: PayoutRequest): Promise<TransferResult> {
    return this.answer({
      providerRef: `po_${request.reference}`,
      status: TransferStatus.Succeeded,
    });
  }

  async onboard(request: MerchantOnboarding): Promise<MerchantAccount> {
    const account: MerchantAccount = {
      accountRef: `acct_${request.reference}`,
      onboardingUrl: `https://onboard.example/${request.reference}`,
      chargesEnabled: false,
      payoutsEnabled: false,
    };
    this.accounts.set(account.accountRef, account);
    return this.answer(account);
  }

  async account(accountRef: string): Promise<MerchantAccount> {
    const account = this.accounts.get(accountRef);
    if (account === undefined) throw new TypeError(`PaymentGatewayFake: no account ${accountRef}`);
    return account;
  }

  async dispute(providerRef: string): Promise<Dispute> {
    return this.disputeOf(providerRef);
  }

  async respond(providerRef: string): Promise<Dispute> {
    return this.answer(this.moveDispute(providerRef, DisputeStatus.UnderReview));
  }

  async accept(providerRef: string): Promise<Dispute> {
    return this.answer(this.moveDispute(providerRef, DisputeStatus.Accepted));
  }

  async startTerminal(request: TerminalRequest): Promise<TerminalSession> {
    const providerRef = `fake_${request.reference}`;
    this.held.set(providerRef, {
      reference: request.reference,
      terminalId: request.terminalId,
      payment: { providerRef, status: PaymentStatus.Pending, amount: request.amount },
    });
    return this.answer({
      providerRef,
      terminalId: request.terminalId,
      status: PaymentStatus.Pending,
    });
  }

  async terminalSession(providerRef: string, terminalId: string): Promise<TerminalSession> {
    const { payment } = this.get(providerRef);
    return {
      providerRef,
      terminalId,
      status: payment.status,
      ...(payment.tip === undefined ? {} : { tip: payment.tip }),
    };
  }

  async cancelTerminal(terminalId: string): Promise<void> {
    for (const held of this.held.values())
      if (held.terminalId === terminalId && held.payment.status === PaymentStatus.Pending)
        this.put(held.reference, { ...held.payment, status: PaymentStatus.Voided });
    this.answer(undefined);
  }

  /** Returns `value`, or throws when an answer is due to be lost. */
  private answer<T>(value: T): T {
    if (this.lost > 0) {
      this.lost -= 1;
      throw ProviderUnavailableError.create({ provider: this.provider });
    }
    return value;
  }

  /** Stores `payment` under its provider id and returns it. */
  private put(reference: string, payment: ProviderPayment): ProviderPayment {
    const terminalId = this.held.get(payment.providerRef)?.terminalId;
    this.held.set(payment.providerRef, {
      reference,
      payment,
      ...(terminalId === undefined ? {} : { terminalId }),
    });
    return payment;
  }

  /** The held payment of `target`, or a `TypeError`. */
  private find(target: PaymentTarget): Held {
    const held =
      (target.providerRef === undefined ? undefined : this.held.get(target.providerRef)) ??
      [...this.held.values()].find((entry) => entry.reference === target.reference);
    if (held === undefined)
      throw new TypeError(`PaymentGatewayFake: no payment ${target.reference}`);
    return held;
  }

  /** The held payment under `providerRef`, or a `TypeError`. */
  private get(providerRef: string): Held {
    const held = this.held.get(providerRef);
    if (held === undefined) throw new TypeError(`PaymentGatewayFake: no payment ${providerRef}`);
    return held;
  }

  /** The dispute under `providerRef`, or a `TypeError`. */
  private disputeOf(providerRef: string): Dispute {
    const dispute = this.disputes.get(providerRef);
    if (dispute === undefined) throw new TypeError(`PaymentGatewayFake: no dispute ${providerRef}`);
    return dispute;
  }

  /** Sets a dispute's status. */
  private moveDispute(providerRef: string, status: DisputeStatus): Dispute {
    const dispute = { ...this.disputeOf(providerRef), status };
    this.disputes.set(providerRef, dispute);
    return dispute;
  }
}
