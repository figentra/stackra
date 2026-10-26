/**
 * Stackra file contract:
 * Purpose: `StripeConnection`, one Stripe account and the Stripe driver of every payments port: Checkout Sessions for
 *          hosted checkout, PaymentIntents for capture, void and saved-token charges (merchant-initiated as
 *          `off_session`), refunds, Connect transfers and Express-style onboarding, disputes, server-driven Terminal
 *          readers with on-reader tipping, and the account's enabled payment methods (wallets and pay-later included).
 *          A connection in `oauth-standard` or `connected-account` mode acts on its `accountRef` with the platform's key
 *          (the `Stripe-Account` header); one in `own-key` mode acts on its own key's account.
 * Boundary: every call goes through `this.api` (the managed client: auth, egress to api.stripe.com only, retries,
 *           refusals, form bodies as the Integration asks), wrapped to add `Stripe-Account` when `accountRef` is set. No card data is sent or read: Checkout and Terminal collect it at Stripe (PCI SAQ-A). Tip
 *           percentages on a reader come from its Stripe Terminal configuration, which the admin sets from the same
 *           tip settings; a request only marks how much of the amount is tip-eligible. The Connect account type is
 *           the connection's `connectAccountType` field (data), never a value here.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decisions 2, 3, 5 and 6); ADR 0356 (decision 2); ADR 0308 (rules 2, 13 and 14).
 */
import { Secret } from "@stackra/config";
import { ConnectedAccount, Connection } from "@stackra/integrations";
import type { IntegrationApi, RequestOptions } from "@stackra/integrations";
import { Money } from "@stackra/money";

import { ChargeInitiator } from "#contracts/enums/charge-initiator.enum";
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
import type { DisputeEvidence } from "#contracts/types/dispute-evidence.type";
import type { DisputeGateway } from "#contracts/types/dispute-gateway.type";
import type { MerchantAccount } from "#contracts/types/merchant-account.type";
import type { MerchantOnboarding } from "#contracts/types/merchant-onboarding.type";
import type { MethodsGateway } from "#contracts/types/methods-gateway.type";
import type { PaymentConnectionMode } from "#contracts/types/payment-connection-mode.type";
import type { PaymentGateway } from "#contracts/types/payment-gateway.type";
import type { PaymentTarget } from "#contracts/types/payment-target.type";
import type { PayoutGateway } from "#contracts/types/payout-gateway.type";
import type { PayoutRequest } from "#contracts/types/payout-request.type";
import type { PlatformGateway } from "#contracts/types/platform-gateway.type";
import type { ProviderPayment } from "#contracts/types/provider-payment.type";
import type { RefundRequest } from "#contracts/types/refund-request.type";
import type { SavedMethod } from "#contracts/types/saved-method.type";
import type { TerminalGateway } from "#contracts/types/terminal-gateway.type";
import type { TerminalRequest } from "#contracts/types/terminal-request.type";
import type { TerminalSession } from "#contracts/types/terminal-session.type";
import type { TokenCharge } from "#contracts/types/token-charge.type";
import type { TokenGateway } from "#contracts/types/token-gateway.type";
import type { TransferResult } from "#contracts/types/transfer-result.type";
import { CapabilityUnsupportedError } from "#core/errors/capability-unsupported.error";
import { InvalidPaymentTransitionError } from "#core/errors/invalid-payment-transition.error";
import { totalOf } from "#core/functions/total-of.function";
import type { StripeIntegration } from "#core/providers/stripe/stripe.integration";
import { stripeParams } from "#core/providers/stripe/stripe-params.function";

/** A Stripe PaymentMethod, as expanded. */
interface StripePaymentMethod {
  readonly id: string;
  readonly card?: { readonly brand?: string; readonly last4?: string };
}

/** A Stripe Charge, as expanded on an intent. */
interface StripeCharge {
  readonly amount_refunded: number;
}

/** A Stripe PaymentIntent, the fields the driver reads. */
interface StripeIntent {
  readonly id: string;
  readonly status: string;
  readonly amount: number;
  readonly amount_received: number;
  readonly currency: string;
  readonly customer?: string | null;
  readonly setup_future_usage?: string | null;
  readonly payment_method?: string | StripePaymentMethod | null;
  readonly latest_charge?: string | StripeCharge | null;
  readonly last_payment_error?: object | null;
  readonly amount_details?: { readonly tip?: { readonly amount?: number } };
}

/** A Stripe Checkout Session, the fields the driver reads. */
interface StripeSession {
  readonly id: string;
  readonly url: string | null;
  readonly status: string;
  readonly amount_total: number | null;
  readonly currency: string;
  readonly expires_at: number;
  readonly payment_intent?: string | StripeIntent | null;
}

/** A Stripe Refund or Transfer, the fields the driver reads. */
interface StripeTransfer {
  readonly id: string;
  readonly status?: string;
}

/** A Stripe Connect account, the fields the driver reads. */
interface StripeAccount {
  readonly id: string;
  readonly charges_enabled: boolean;
  readonly payouts_enabled: boolean;
  readonly business_profile?: { readonly name?: string | null };
}

/** A Stripe Dispute, the fields the driver reads. */
interface StripeDispute {
  readonly id: string;
  readonly amount: number;
  readonly currency: string;
  readonly reason: string;
  readonly status: string;
  readonly payment_intent: string | null;
  readonly charge: string;
  readonly evidence_details?: { readonly due_by?: number | null };
}

/** One payment method of a configuration, the fields the driver reads. */
interface StripeMethodSetting {
  readonly available?: boolean;
  readonly display_preference?: { readonly value?: string };
}

/** A Stripe PaymentMethodConfiguration: its flags, and one setting per payment method code. */
type StripeMethodConfiguration = {
  readonly id: string;
  readonly active?: boolean;
  readonly is_default?: boolean;
} & Readonly<Record<string, unknown>>;

/** Expansions that let one read of an intent answer its status, refunds and saved card. */
const INTENT_EXPAND = { expand: ["latest_charge", "payment_method"] };

/** The intent's state as a `PaymentStatus`. */
function statusOf(intent: StripeIntent): PaymentStatus {
  switch (intent.status) {
    case "requires_capture":
      return PaymentStatus.Authorized;
    case "canceled":
      return PaymentStatus.Voided;
    case "succeeded": {
      const charge = typeof intent.latest_charge === "object" ? intent.latest_charge : null;
      const refunded = charge?.amount_refunded ?? 0;
      if (refunded === 0) return PaymentStatus.Captured;
      return refunded >= intent.amount_received
        ? PaymentStatus.Refunded
        : PaymentStatus.PartiallyRefunded;
    }
    case "requires_payment_method":
      return intent.last_payment_error == null ? PaymentStatus.Pending : PaymentStatus.Failed;
    default:
      return PaymentStatus.Pending;
  }
}

/** A Stripe dispute state as a `DisputeStatus`. */
function disputeStatusOf(status: string): DisputeStatus {
  switch (status) {
    case "won":
    case "warning_closed":
      return DisputeStatus.Won;
    case "lost":
      return DisputeStatus.Lost;
    case "under_review":
    case "warning_under_review":
      return DisputeStatus.UnderReview;
    default:
      return DisputeStatus.NeedsResponse;
  }
}

/** A refund or transfer state as a `TransferStatus`. */
function transferStatusOf(status: string | undefined): TransferStatus {
  if (status === undefined || status === "succeeded" || status === "paid")
    return TransferStatus.Succeeded;
  return status === "failed" || status === "canceled"
    ? TransferStatus.Failed
    : TransferStatus.Pending;
}

/**
 * A Stripe account, as tenant or platform.
 *
 * @example
 * const session = await connection.checkout({ reference, amount, description, returnUrl, cancelUrl });
 */
export class StripeConnection
  extends Connection<StripeIntegration>
  implements
    PaymentGateway,
    CaptureGateway,
    TokenGateway,
    PayoutGateway,
    PlatformGateway,
    DisputeGateway,
    TerminalGateway,
    MethodsGateway
{
  /** The account's secret key (`sk_live_…` or `sk_test_…`); a restricted key works when it has the scopes used. */
  @Secret("STRIPE_SECRET_KEY")
  secretKey!: string;

  /** The Connect account type for `onboard` (`express`, `standard` or `custom`); onboarding is refused without it. */
  connectAccountType?: string;

  /** How the connection reaches the money; `own-key` when absent. */
  mode?: PaymentConnectionMode;

  /** The connected account (`acct_…`) an `oauth-standard` or `connected-account` connection acts on. */
  accountRef?: string;

  /** The webhook endpoint's signing secret (`whsec_…`), the Integration's `{webhookSecret}`. */
  @Secret("STRIPE_WEBHOOK_SECRET")
  webhookSecret?: string;

  /** The Integration's provider code. */
  get provider(): string {
    return "stripe";
  }

  /** Every port. */
  get capabilities(): readonly PaymentCapability[] {
    return Object.values(PaymentCapability);
  }

  async check(): Promise<ConnectedAccount> {
    const account = await this.stripe.get<StripeAccount>("/v1/account");
    return ConnectedAccount.create({
      id: account.id,
      label: account.business_profile?.name ?? account.id,
    });
  }

  async checkout(request: CheckoutRequest): Promise<CheckoutSession> {
    const total = totalOf(request);
    const session = await this.stripe.post<StripeSession>(
      "/v1/checkout/sessions",
      stripeParams({
        mode: "payment",
        client_reference_id: request.reference,
        success_url: request.returnUrl,
        cancel_url: request.cancelUrl,
        customer_email: request.customer?.email,
        customer_creation: request.saveMethod === true ? "always" : undefined,
        locale: request.locale?.split("-")[0],
        expires_at:
          request.expiresAt === undefined
            ? undefined
            : Math.floor(request.expiresAt.getTime() / 1000),
        metadata: { reference: request.reference },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: total.currency.toLowerCase(),
              unit_amount: total.minor,
              product_data: { name: request.description },
            },
          },
        ],
        payment_intent_data: {
          capture_method: request.captureLater === true ? "manual" : undefined,
          setup_future_usage: request.saveMethod === true ? "off_session" : undefined,
          metadata: { reference: request.reference },
          application_fee_amount: request.platform?.fee.minor,
          transfer_data:
            request.platform === undefined
              ? undefined
              : { destination: request.platform.accountRef },
        },
      }),
    );
    return {
      providerRef: session.id,
      kind: SessionKind.Redirect,
      url: session.url ?? "",
      expiresAt: new Date(session.expires_at * 1000),
    };
  }

  async lookup(target: PaymentTarget): Promise<ProviderPayment | null> {
    const ref = target.providerRef;
    if (ref?.startsWith("cs_") === true) {
      const session = await this.stripe.get<StripeSession>(`/v1/checkout/sessions/${ref}`, {
        query: stripeParams({
          expand: ["payment_intent.latest_charge", "payment_intent.payment_method"],
        }),
      });
      const intent = typeof session.payment_intent === "object" ? session.payment_intent : null;
      if (intent !== null) return this.paymentOf(intent);
      return {
        providerRef: session.id,
        status: session.status === "expired" ? PaymentStatus.Failed : PaymentStatus.Pending,
        amount: Money.ofMinor(session.amount_total ?? 0, session.currency.toUpperCase()),
      };
    }
    if (ref !== undefined) return this.paymentOf(await this.intent(ref));
    const found = await this.stripe.get<{ readonly data: readonly StripeIntent[] }>(
      "/v1/payment_intents/search",
      {
        query: stripeParams({
          query: `metadata['reference']:'${target.reference.replaceAll("'", "\\'")}'`,
          expand: ["data.latest_charge", "data.payment_method"],
        }),
      },
    );
    const intent = found.data[0];
    return intent === undefined ? null : this.paymentOf(intent);
  }

  async capture(request: CaptureRequest): Promise<ProviderPayment> {
    const intentId = await this.intentIdOf(request.payment, "capture");
    const intent = await this.stripe.post<StripeIntent>(
      `/v1/payment_intents/${intentId}/capture`,
      stripeParams({ amount_to_capture: request.amount.minor, ...INTENT_EXPAND }),
      { idempotencyKey: `capture:${request.reference}` },
    );
    return this.paymentOf(intent);
  }

  async void(target: PaymentTarget): Promise<ProviderPayment> {
    if (target.providerRef?.startsWith("cs_") === true) {
      const found = await this.lookup(target);
      if (found !== null && found.providerRef.startsWith("cs_")) {
        const session = await this.stripe.post<StripeSession>(
          `/v1/checkout/sessions/${found.providerRef}/expire`,
        );
        return {
          providerRef: session.id,
          status: PaymentStatus.Voided,
          amount: found.amount,
        };
      }
    }
    const intentId = await this.intentIdOf(target, "void");
    const intent = await this.stripe.post<StripeIntent>(
      `/v1/payment_intents/${intentId}/cancel`,
      stripeParams(INTENT_EXPAND),
    );
    return this.paymentOf(intent);
  }

  async refund(request: RefundRequest): Promise<TransferResult> {
    const intentId = await this.intentIdOf(request.payment, "refund");
    const refund = await this.stripe.post<StripeTransfer>(
      "/v1/refunds",
      stripeParams({
        payment_intent: intentId,
        amount: request.amount.minor,
        metadata: { reference: request.reference, reason: request.reason },
      }),
      { idempotencyKey: `refund:${request.reference}` },
    );
    return { providerRef: refund.id, status: transferStatusOf(refund.status) };
  }

  async charge(request: TokenCharge): Promise<ProviderPayment> {
    const merchant = request.initiator === ChargeInitiator.Merchant;
    const intent = await this.stripe.post<StripeIntent>(
      "/v1/payment_intents",
      stripeParams({
        amount: request.amount.minor,
        currency: request.amount.currency.toLowerCase(),
        customer: request.method.customerRef,
        payment_method: request.method.token,
        confirm: true,
        off_session: merchant,
        description: request.description,
        metadata: { reference: request.reference },
        ...INTENT_EXPAND,
      }),
      { idempotencyKey: `charge:${request.reference}` },
    );
    return this.paymentOf(intent);
  }

  async payout(request: PayoutRequest): Promise<TransferResult> {
    const transfer = await this.stripe.post<StripeTransfer>(
      "/v1/transfers",
      stripeParams({
        amount: request.amount.minor,
        currency: request.amount.currency.toLowerCase(),
        destination: request.destination,
        description: request.description,
        metadata: { reference: request.reference },
      }),
      { idempotencyKey: `payout:${request.reference}` },
    );
    return { providerRef: transfer.id, status: TransferStatus.Succeeded };
  }

  async onboard(request: MerchantOnboarding): Promise<MerchantAccount> {
    if (this.connectAccountType === undefined || this.connectAccountType === "")
      throw CapabilityUnsupportedError.create({
        provider: this.provider,
        capability: PaymentCapability.Platform,
      });
    const account = await this.stripe.post<StripeAccount>(
      "/v1/accounts",
      stripeParams({
        type: this.connectAccountType,
        country: request.country,
        email: request.email,
        metadata: { reference: request.reference },
      }),
      { idempotencyKey: `onboard:${request.reference}` },
    );
    const link = await this.stripe.post<{ readonly url: string }>(
      "/v1/account_links",
      stripeParams({
        account: account.id,
        type: "account_onboarding",
        return_url: request.returnUrl,
        refresh_url: request.refreshUrl,
      }),
    );
    return {
      accountRef: account.id,
      onboardingUrl: link.url,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    };
  }

  async account(accountRef: string): Promise<MerchantAccount> {
    const account = await this.stripe.get<StripeAccount>(`/v1/accounts/${accountRef}`);
    return {
      accountRef: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    };
  }

  async dispute(providerRef: string): Promise<Dispute> {
    return this.disputeOf(await this.stripe.get<StripeDispute>(`/v1/disputes/${providerRef}`));
  }

  async respond(providerRef: string, evidence: DisputeEvidence): Promise<Dispute> {
    const dispute = await this.stripe.post<StripeDispute>(
      `/v1/disputes/${providerRef}`,
      stripeParams({
        submit: true,
        evidence: { uncategorized_text: evidence.text, uncategorized_file: evidence.files?.[0] },
      }),
    );
    return this.disputeOf(dispute);
  }

  async accept(providerRef: string): Promise<Dispute> {
    const dispute = await this.stripe.post<StripeDispute>(`/v1/disputes/${providerRef}/close`);
    return { ...this.disputeOf(dispute), status: DisputeStatus.Accepted };
  }

  async startTerminal(request: TerminalRequest): Promise<TerminalSession> {
    const intent = await this.stripe.post<StripeIntent>(
      "/v1/payment_intents",
      stripeParams({
        amount: request.amount.minor,
        currency: request.amount.currency.toLowerCase(),
        payment_method_types: ["card_present"],
        capture_method: request.captureLater === true ? "manual" : "automatic",
        metadata: { reference: request.reference },
      }),
      { idempotencyKey: `terminal:${request.reference}` },
    );
    await this.stripe.post(
      `/v1/terminal/readers/${request.terminalId}/process_payment_intent`,
      stripeParams({
        payment_intent: intent.id,
        process_config:
          request.tipPrompt === undefined
            ? undefined
            : { tipping: { amount_eligible: request.amount.minor } },
      }),
    );
    return {
      providerRef: intent.id,
      terminalId: request.terminalId,
      status: PaymentStatus.Pending,
    };
  }

  async terminalSession(providerRef: string, terminalId: string): Promise<TerminalSession> {
    const payment = this.paymentOf(await this.intent(providerRef));
    return {
      providerRef,
      terminalId,
      status: payment.status,
      ...(payment.tip === undefined ? {} : { tip: payment.tip }),
    };
  }

  async cancelTerminal(terminalId: string): Promise<void> {
    await this.stripe.post(`/v1/terminal/readers/${terminalId}/cancel_action`);
  }

  async paymentMethods(): Promise<readonly string[]> {
    const listed = await this.stripe.get<{ readonly data: readonly StripeMethodConfiguration[] }>(
      "/v1/payment_method_configurations",
    );
    const configuration =
      listed.data.find((entry) => entry.is_default === true) ??
      listed.data.find((entry) => entry.active === true);
    if (configuration === undefined) return [];
    return Object.entries(configuration).flatMap(([code, setting]) => {
      if (typeof setting !== "object" || setting === null) return [];
      const method = setting as StripeMethodSetting;
      return method.available === true && method.display_preference?.value === "on" ? [code] : [];
    });
  }

  /** The managed client, acting on `accountRef` when the connection has one. */
  private get stripe(): IntegrationApi {
    const api = this.api;
    const account = this.accountRef;
    if (account === undefined || account === "") return api;
    const on = (options?: RequestOptions): RequestOptions => ({
      ...options,
      headers: { ...options?.headers, "Stripe-Account": account },
    });
    return {
      get: <T>(path: string, options?: RequestOptions) => api.get<T>(path, on(options)),
      delete: <T>(path: string, options?: RequestOptions) => api.delete<T>(path, on(options)),
      post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
        api.post<T>(path, body, on(options)),
      put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
        api.put<T>(path, body, on(options)),
      patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
        api.patch<T>(path, body, on(options)),
    };
  }

  /** The intent `id`, expanded for status, refunds and the saved card. */
  private intent(id: string): Promise<StripeIntent> {
    return this.stripe.get<StripeIntent>(`/v1/payment_intents/${id}`, {
      query: stripeParams(INTENT_EXPAND),
    });
  }

  /**
   * The PaymentIntent id behind `target`: the target itself, or the intent of its Checkout Session.
   *
   * @throws InvalidPaymentTransitionError when the session has no intent yet (nobody paid).
   */
  private async intentIdOf(target: PaymentTarget, operation: string): Promise<string> {
    if (target.providerRef !== undefined && !target.providerRef.startsWith("cs_"))
      return target.providerRef;
    const found = await this.lookup(target);
    if (found === null || found.providerRef.startsWith("cs_"))
      throw InvalidPaymentTransitionError.create({
        reference: target.reference,
        status: found?.status ?? PaymentStatus.Failed,
        operation,
      });
    return found.providerRef;
  }

  /** An intent as a `ProviderPayment`, with its tip and saved card when there are. */
  private paymentOf(intent: StripeIntent): ProviderPayment {
    const currency = intent.currency.toUpperCase();
    const tip = intent.amount_details?.tip?.amount;
    const method = this.methodOf(intent);
    return {
      providerRef: intent.id,
      status: statusOf(intent),
      amount: Money.ofMinor(intent.amount, currency),
      ...(tip === undefined || tip === 0 ? {} : { tip: Money.ofMinor(tip, currency) }),
      ...(method === undefined ? {} : { method }),
    };
  }

  /** The card the customer agreed to save with this intent, when they did. */
  private methodOf(intent: StripeIntent): SavedMethod | undefined {
    const card = typeof intent.payment_method === "object" ? intent.payment_method : null;
    if (card === null || intent.setup_future_usage == null) return undefined;
    return {
      provider: this.provider,
      connectionId: this.id,
      token: card.id,
      merchantInitiated: intent.setup_future_usage === "off_session",
      ...(intent.customer == null ? {} : { customerRef: intent.customer }),
      ...(card.card?.brand === undefined ? {} : { brand: card.card.brand }),
      ...(card.card?.last4 === undefined ? {} : { last4: card.card.last4 }),
    };
  }

  /** A Stripe dispute as a `Dispute`. */
  private disputeOf(dispute: StripeDispute): Dispute {
    const due = dispute.evidence_details?.due_by;
    return {
      providerRef: dispute.id,
      paymentRef: dispute.payment_intent ?? dispute.charge,
      amount: Money.ofMinor(dispute.amount, dispute.currency.toUpperCase()),
      reason: dispute.reason,
      status: disputeStatusOf(dispute.status),
      ...(due == null ? {} : { respondBy: new Date(due * 1000) }),
    };
  }
}
