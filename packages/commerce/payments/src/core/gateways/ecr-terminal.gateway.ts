/**
 * Stackra file contract:
 * Purpose: `EcrTerminalGateway`, the `TerminalGateway` of a semi-integrated card terminal the till drives over a
 *          local link under its provider's electronic cash register (ECR) protocol: a sale with the tip prompt, a
 *          pre-authorisation with its completion and void, a card-present refund, a cancel of what the terminal shows
 *          and the last-transaction inquiry that reconciles it. One class serves every provider; the provider is its
 *          `EcrProfile` (pack data), so the `geidea` and `network-international` drivers are two profiles.
 * Boundary: runs on the till (the Expo staff app or the Electron main process), bound per till as the gateway the
 *           till's `PaymentGateways` returns for the provider. It speaks through the structural `EcrLink`, so it holds
 *           no socket, no native module and no card data; the PIN and the card stay on the terminal. Every rejected
 *           link call is a lost answer (`ProviderUnavailableError`), which `PaymentService` turns into `unknown` and
 *           reconciles by `lookup` (cancel-then-reconcile, ADR 0377 decision 2). One terminal runs one operation at a
 *           time, so calls queue; `cancelTerminal` alone goes beside a running sale. No hosted checkout: `checkout`
 *           refuses. Profiles written from public documentation are `certification: "pending"`.
 * Runtime: isomorphic
 * Governing contract: ADR 0377 (decisions 1 to 4, 8 and 9); ADR 0357 (decisions 5 and 6); ADR 0339 (decision 1);
 *                     ADR 0220 (integer minor units).
 */
import { ProviderUnavailableError } from "@stackra/integrations";
import { Money } from "@stackra/money";

import { EcrOutcome } from "#contracts/enums/ecr-outcome.enum";
import { PaymentCapability } from "#contracts/enums/payment-capability.enum";
import { PaymentStatus } from "#contracts/enums/payment-status.enum";
import { TransferStatus } from "#contracts/enums/transfer-status.enum";
import type { CaptureGateway } from "#contracts/types/capture-gateway.type";
import type { CaptureRequest } from "#contracts/types/capture-request.type";
import type { CheckoutSession } from "#contracts/types/checkout-session.type";
import type { EcrLink } from "#contracts/types/ecr-link.type";
import type { EcrOperation } from "#contracts/types/ecr-operation.type";
import type { EcrProfile } from "#contracts/types/ecr-profile.type";
import type { EcrRequestField } from "#contracts/types/ecr-request-field.type";
import type { EcrTerminalGatewayOptions } from "#contracts/types/ecr-terminal-gateway-options.type";
import type { PaymentGateway } from "#contracts/types/payment-gateway.type";
import type { PaymentTarget } from "#contracts/types/payment-target.type";
import type { ProviderPayment } from "#contracts/types/provider-payment.type";
import type { RefundRequest } from "#contracts/types/refund-request.type";
import type { TerminalGateway } from "#contracts/types/terminal-gateway.type";
import type { TerminalRequest } from "#contracts/types/terminal-request.type";
import type { TerminalSession } from "#contracts/types/terminal-session.type";
import type { TransferResult } from "#contracts/types/transfer-result.type";
import { CapabilityUnsupportedError } from "#core/errors/capability-unsupported.error";
import { decodeEcrMessage } from "#core/functions/decode-ecr-message.function";
import { encodeEcrMessage } from "#core/functions/encode-ecr-message.function";
import type { EcrAnswer } from "#core/types/ecr-answer.type";

/** What an approved answer leaves the payment in, per operation that moves a payment. */
const APPROVED: Readonly<Record<EcrOperation, PaymentStatus>> = {
  sale: PaymentStatus.Captured,
  authorize: PaymentStatus.Authorized,
  completion: PaymentStatus.Captured,
  void: PaymentStatus.Voided,
  refund: PaymentStatus.Refunded,
  inquiry: PaymentStatus.Unknown,
  cancel: PaymentStatus.Voided,
};

/**
 * A semi-integrated terminal over its ECR protocol.
 *
 * @example
 * const gateway = new EcrTerminalGateway({ id: till.terminalConnection, profile, link: cardTerminal, currency: "SAR" });
 * const session = await payments.startTerminal(market, { reference, terminalId, amount, tipPrompt });
 * await payments.cancelTerminal(reference); // cancel, then the inquiry says where it ended
 */
export class EcrTerminalGateway implements PaymentGateway, TerminalGateway, CaptureGateway {
  /** The terminal Connection's id. */
  readonly id: string;

  /** The provider code, the profile's. */
  readonly provider: string;

  /** `terminal`, plus `terminal_tips` when the profile sends the tip prompt and `capture` when it has the three codes. */
  readonly capabilities: readonly PaymentCapability[];

  /** The provider's protocol. */
  private readonly profile: EcrProfile;

  /** The link to the terminal. */
  private readonly link: EcrLink;

  /** The till's currency. */
  private readonly currency: string;

  /**
   * The payments this driver saw answered, by merchant reference.
   * shortcut: grows for the life of the process (a till restarts daily); bound it if a till runs for weeks.
   */
  private readonly seen = new Map<string, ProviderPayment>();

  /** The operation running on the terminal, answer read and recorded; the next waits for it. */
  private running: Promise<unknown> = Promise.resolve();

  /** The reference the terminal is working on, for a cancel; null when idle. */
  private showing: string | null = null;

  /**
   * @param options - the Connection id, the provider's profile, the link and the till's currency.
   */
  constructor(options: EcrTerminalGatewayOptions) {
    this.id = options.id;
    this.profile = options.profile;
    this.provider = options.profile.provider;
    this.link = options.link;
    this.currency = options.currency;
    const { operations, request } = options.profile;
    this.capabilities = [
      PaymentCapability.Terminal,
      ...(request.includes("tip_percentages") ? [PaymentCapability.TerminalTips] : []),
      ...(operations.authorize !== undefined &&
      operations.completion !== undefined &&
      operations.void !== undefined
        ? [PaymentCapability.Capture]
        : []),
    ];
  }

  /**
   * A semi-integrated terminal has no hosted page.
   *
   * @throws CapabilityUnsupportedError always.
   */
  async checkout(): Promise<CheckoutSession> {
    throw this.unsupported(PaymentCapability.Checkout);
  }

  /**
   * Presents the amount (and the tip prompt) and resolves when the terminal answers: the session carries the final
   * state and the tip the customer chose.
   *
   * @throws ProviderUnavailableError when the answer is lost.
   * @throws CapabilityUnsupportedError for `captureLater` without the profile's pre-authorisation codes.
   */
  async startTerminal(request: TerminalRequest): Promise<TerminalSession> {
    const operation: EcrOperation = request.captureLater === true ? "authorize" : "sale";
    const tip = request.tipPrompt;
    return this.chain(async () => {
      const answer = await this.ask(operation, request.reference, {
        amount: String(request.amount.minor),
        currency: request.amount.currency,
        terminal: request.terminalId,
        ...(tip === undefined
          ? {}
          : { tip_percentages: tip.percentages.join(","), tip_custom: tip.custom ? "1" : "0" }),
      });
      const payment = this.remember(
        request.reference,
        this.paymentOf(answer, operation, request.amount),
      );
      return {
        providerRef: payment.providerRef,
        terminalId: request.terminalId,
        status: payment.status,
        ...(payment.tip === undefined ? {} : { tip: payment.tip }),
      };
    });
  }

  /** The session as the terminal last answered it, or as the inquiry reads it. */
  async terminalSession(providerRef: string, terminalId: string): Promise<TerminalSession> {
    const reference = [...this.seen].find(([, seen]) => seen.providerRef === providerRef)?.[0];
    const payment = await this.lookup({ reference: reference ?? providerRef, providerRef });
    return {
      providerRef,
      terminalId,
      status: payment?.status ?? PaymentStatus.Unknown,
      ...(payment?.tip === undefined ? {} : { tip: payment.tip }),
    };
  }

  /**
   * Sends the profile's cancel for what the terminal is working on; nothing when it is idle. The running sale then
   * answers `cancelled` (or approved, when the card was read first): `PaymentService.cancelTerminal` reconciles next.
   *
   * @throws ProviderUnavailableError when the terminal does not acknowledge the cancel.
   */
  async cancelTerminal(terminalId: string, providerRef?: string): Promise<void> {
    const reference = this.showing;
    if (reference === null) return;
    const payload = encodeEcrMessage(this.profile, {
      operation: this.profile.operations.cancel,
      reference,
      terminal: terminalId,
      ...(providerRef === undefined ? {} : { provider_ref: providerRef }),
    });
    try {
      await this.link.signal(payload, this.profile.timing);
    } catch {
      throw this.lost();
    }
  }

  /**
   * The payment as this till saw it answered, else as the terminal's last-transaction inquiry reads it, once the
   * running operation has settled and been recorded.
   *
   * @returns null when this till never saw `target` answered and the terminal holds no transaction at all.
   * @throws ProviderUnavailableError when the inquiry's answer is lost, or names another payment (only a manager's
   *         `resolve` can then say what happened, so the payment stays `unknown`).
   */
  async lookup(target: PaymentTarget): Promise<ProviderPayment | null> {
    return this.chain(async () => {
      const known = this.seen.get(target.reference);
      if (known !== undefined) return known;
      const answer = await this.ask(
        "inquiry",
        target.reference,
        target.providerRef === undefined ? {} : { provider_ref: target.providerRef },
      );
      // The terminal holds no transaction at all.
      if (answer.reference === undefined && answer.provider_ref === undefined) return null;
      const same =
        answer.reference === target.reference ||
        (target.providerRef !== undefined && answer.provider_ref === target.providerRef);
      if (!same) throw this.lost();
      const operation = this.operationOf(answer.operation) ?? "sale";
      return this.remember(
        target.reference,
        this.paymentOf(answer, operation, Money.zero(this.currency)),
      );
    });
  }

  /**
   * Completes a pre-authorisation for `request.amount`.
   *
   * @throws CapabilityUnsupportedError without the profile's completion code.
   * @throws ProviderUnavailableError when the answer is lost.
   */
  async capture(request: CaptureRequest): Promise<ProviderPayment> {
    return this.chain(async () => {
      const answer = await this.ask("completion", request.payment.reference, {
        amount: String(request.amount.minor),
        currency: request.amount.currency,
        ...(request.payment.providerRef === undefined
          ? {}
          : { provider_ref: request.payment.providerRef }),
      });
      return this.remember(
        request.payment.reference,
        this.paymentOf(answer, "completion", request.amount),
      );
    });
  }

  /**
   * Voids a pre-authorisation on the terminal.
   *
   * @throws CapabilityUnsupportedError without the profile's void code.
   * @throws ProviderUnavailableError when the answer is lost.
   */
  async void(target: PaymentTarget): Promise<ProviderPayment> {
    return this.chain(async () => {
      const known = this.seen.get(target.reference);
      const answer = await this.ask(
        "void",
        target.reference,
        target.providerRef === undefined ? {} : { provider_ref: target.providerRef },
      );
      return this.remember(
        target.reference,
        this.paymentOf(answer, "void", known?.amount ?? Money.zero(this.currency)),
      );
    });
  }

  /**
   * A card-present refund of `request.amount` against the original payment.
   *
   * @throws ProviderUnavailableError when the answer is lost or its result code is not in the profile.
   */
  async refund(request: RefundRequest): Promise<TransferResult> {
    return this.chain(async () => {
      const answer = await this.ask("refund", request.reference, {
        amount: String(request.amount.minor),
        currency: request.amount.currency,
        ...(request.payment.providerRef === undefined
          ? {}
          : { provider_ref: request.payment.providerRef }),
      });
      const outcome = answer.result === undefined ? undefined : this.profile.results[answer.result];
      if (outcome === undefined) throw this.lost();
      const status =
        outcome === EcrOutcome.Approved
          ? TransferStatus.Succeeded
          : outcome === EcrOutcome.Pending
            ? TransferStatus.Pending
            : TransferStatus.Failed;
      return { providerRef: answer.provider_ref ?? request.reference, status };
    });
  }

  /** Runs `work` once the operation before it has settled, so the terminal runs one operation at a time. */
  private chain<T>(work: () => Promise<T>): Promise<T> {
    const next = this.running.catch(() => undefined).then(work);
    this.running = next;
    return next;
  }

  /**
   * Sends one operation to the terminal and reads the answer; called inside `chain` only.
   *
   * @throws CapabilityUnsupportedError when the profile has no code for `operation`.
   * @throws ProviderUnavailableError when the link rejects or the answer cannot be read.
   */
  private async ask(
    operation: EcrOperation,
    reference: string,
    values: Readonly<Partial<Record<EcrRequestField, string>>>,
  ): Promise<EcrAnswer> {
    const code = this.profile.operations[operation as keyof EcrProfile["operations"]];
    if (code === undefined) throw this.unsupported(PaymentCapability.Capture);
    const payload = encodeEcrMessage(this.profile, { ...values, operation: code, reference });
    this.showing = reference;
    try {
      return decodeEcrMessage(this.profile, await this.link.exchange(payload, this.profile.timing));
    } catch {
      throw this.lost();
    } finally {
      this.showing = null;
    }
  }

  /** The payment an answer to `operation` describes; an unlisted result code leaves it `unknown`. */
  private paymentOf(answer: EcrAnswer, operation: EcrOperation, asked: Money): ProviderPayment {
    const outcome = answer.result === undefined ? undefined : this.profile.results[answer.result];
    const moved = operation === "completion" || operation === "void";
    const status =
      outcome === undefined
        ? PaymentStatus.Unknown
        : outcome === EcrOutcome.Approved
          ? APPROVED[operation]
          : outcome === EcrOutcome.Pending
            ? PaymentStatus.Pending
            : moved
              ? PaymentStatus.Authorized
              : outcome === EcrOutcome.Cancelled
                ? PaymentStatus.Voided
                : PaymentStatus.Failed;
    const amount = this.minorOf(answer.amount, asked.currency) ?? asked;
    const tip = this.minorOf(answer.tip, asked.currency);
    return {
      providerRef: answer.provider_ref ?? answer.reference ?? "",
      status,
      amount,
      ...(tip === undefined || tip.minor === 0 ? {} : { tip }),
    };
  }

  /** The operation a profile code names, for an inquiry's answer. */
  private operationOf(code: string | undefined): EcrOperation | undefined {
    const found = Object.entries(this.profile.operations).find(([, value]) => value === code);
    return found?.[0] as EcrOperation | undefined;
  }

  /** Integer minor units as money; undefined for a missing or malformed value. */
  private minorOf(value: string | undefined, currency: string): Money | undefined {
    if (value === undefined || !/^\d+$/.test(value)) return undefined;
    return Money.ofMinor(Number(value), currency);
  }

  /** Keeps `payment` under `reference` and returns it. */
  private remember(reference: string, payment: ProviderPayment): ProviderPayment {
    if (payment.status !== PaymentStatus.Unknown) this.seen.set(reference, payment);
    return payment;
  }

  /** The lost-answer refusal. */
  private lost(): ProviderUnavailableError {
    return ProviderUnavailableError.create({ provider: this.provider });
  }

  /** The refusal of a capability this profile lacks. */
  private unsupported(capability: PaymentCapability): CapabilityUnsupportedError {
    return CapabilityUnsupportedError.create({ provider: this.provider, capability });
  }
}
