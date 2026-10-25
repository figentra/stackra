/**
 * Stackra file contract:
 * Purpose: `CheckoutConnection`, one Checkout.com account and its payments driver: the Hosted Payments Page (or a
 *          Payment Link when the checkout has an expiry), lookup by payment id or by the merchant reference, capture,
 *          void and refund, and disputes with evidence.
 * Boundary: every call goes through `this.api`. Capture, void and refund are accepted asynchronously (202): the
 *           driver reports the requested outcome and a later lookup confirms it. The billing country Checkout.com
 *           requires is the customer's address country; without it the checkout is refused, never defaulted.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decisions 2, 5 and 6); ADR 0356 (decision 2); ADR 0308 (rules 2, 13 and 14).
 */
import { Secret } from "@stackra/config";
import { ConnectedAccount, Connection } from "@stackra/integrations";
import { Money } from "@stackra/money";

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
import type { PaymentGateway } from "#contracts/types/payment-gateway.type";
import type { PaymentTarget } from "#contracts/types/payment-target.type";
import type { ProviderPayment } from "#contracts/types/provider-payment.type";
import type { RefundRequest } from "#contracts/types/refund-request.type";
import type { TransferResult } from "#contracts/types/transfer-result.type";
import { InvalidPaymentTransitionError } from "#core/errors/invalid-payment-transition.error";
import { PaymentFieldRequiredError } from "#core/errors/payment-field-required.error";
import { totalOf } from "#core/functions/total-of.function";
import type { CheckoutIntegration } from "#core/providers/checkout/checkout.integration";

/** A Checkout.com payment, the fields the driver reads. */
interface CkoPayment {
  readonly id: string;
  readonly status: string;
  readonly amount: number;
  readonly currency: string;
}

/** A Checkout.com hosted page or payment link, as created. */
interface CkoSession {
  readonly id: string;
  readonly expires_on?: string;
  readonly _links: { readonly redirect: { readonly href: string } };
}

/** A Checkout.com dispute, the fields the driver reads. */
interface CkoDispute {
  readonly id: string;
  readonly status: string;
  readonly amount: number;
  readonly currency: string;
  readonly reason_code: string;
  readonly payment_id: string;
  readonly evidence_required_by?: string;
}

/** Checkout.com's payment states as `PaymentStatus`. */
const STATUSES: Readonly<Record<string, PaymentStatus>> = {
  Pending: PaymentStatus.Pending,
  Authorized: PaymentStatus.Authorized,
  "Card Verified": PaymentStatus.Authorized,
  Captured: PaymentStatus.Captured,
  "Partially Captured": PaymentStatus.Captured,
  Paid: PaymentStatus.Captured,
  "Partially Refunded": PaymentStatus.PartiallyRefunded,
  Refunded: PaymentStatus.Refunded,
  Voided: PaymentStatus.Voided,
  Declined: PaymentStatus.Failed,
  Canceled: PaymentStatus.Failed,
  Expired: PaymentStatus.Failed,
};

/** Checkout.com's dispute states as `DisputeStatus`. */
const DISPUTE_STATUSES: Readonly<Record<string, DisputeStatus>> = {
  evidence_required: DisputeStatus.NeedsResponse,
  evidence_under_review: DisputeStatus.UnderReview,
  won: DisputeStatus.Won,
  resolved: DisputeStatus.Won,
  lost: DisputeStatus.Lost,
  expired: DisputeStatus.Lost,
  accepted: DisputeStatus.Accepted,
};

/**
 * A Checkout.com account, as tenant or platform.
 *
 * @example
 * const session = await connection.checkout(request);
 */
export class CheckoutConnection
  extends Connection<CheckoutIntegration>
  implements PaymentGateway, CaptureGateway, DisputeGateway
{
  /** The account's secret key (`sk_…`). */
  @Secret("CHECKOUT_SECRET_KEY")
  secretKey!: string;

  /** The processing channel every payment is booked on (`pc_…`). */
  processingChannelId!: string;

  /** The Integration's provider code. */
  get provider(): string {
    return "checkout";
  }

  /** Hosted checkout, capture and void, disputes. */
  get capabilities(): readonly PaymentCapability[] {
    return [PaymentCapability.Checkout, PaymentCapability.Capture, PaymentCapability.Disputes];
  }

  async check(): Promise<ConnectedAccount> {
    await this.api.get("/payments", { query: { reference: "stackra-connection-check", limit: 1 } });
    return ConnectedAccount.create({ id: this.processingChannelId });
  }

  async checkout(request: CheckoutRequest): Promise<CheckoutSession> {
    const country = request.customer?.address?.country;
    if (country === undefined)
      throw PaymentFieldRequiredError.create({
        provider: this.provider,
        field: "customer.address",
      });
    const total = totalOf(request);
    const body = {
      amount: total.minor,
      currency: total.currency,
      reference: request.reference,
      description: request.description,
      processing_channel_id: this.processingChannelId,
      capture: request.captureLater !== true,
      billing: { address: { country } },
      ...(request.customer?.email === undefined
        ? {}
        : { customer: { email: request.customer.email, name: request.customer.name } }),
      ...(request.locale === undefined ? {} : { locale: request.locale }),
    };
    const session =
      request.expiresAt === undefined
        ? await this.api.post<CkoSession>("/hosted-payments", {
            ...body,
            success_url: request.returnUrl,
            failure_url: request.cancelUrl,
            cancel_url: request.cancelUrl,
          })
        : await this.api.post<CkoSession>("/payment-links", {
            ...body,
            return_url: request.returnUrl,
            expires_in: Math.max(1, Math.floor((request.expiresAt.getTime() - Date.now()) / 1000)),
          });
    return {
      providerRef: session.id,
      kind: SessionKind.Redirect,
      url: session._links.redirect.href,
      ...(session.expires_on === undefined ? {} : { expiresAt: new Date(session.expires_on) }),
    };
  }

  async lookup(target: PaymentTarget): Promise<ProviderPayment | null> {
    if (target.providerRef?.startsWith("pay_") === true)
      return this.paymentOf(await this.api.get<CkoPayment>(`/payments/${target.providerRef}`));
    const found = await this.api.get<{ readonly data: readonly CkoPayment[] }>("/payments", {
      query: { reference: target.reference, limit: 1 },
    });
    const payment = found.data[0];
    return payment === undefined ? null : this.paymentOf(payment);
  }

  async capture(request: CaptureRequest): Promise<ProviderPayment> {
    const id = await this.paymentIdOf(request.payment, "capture");
    await this.api.post(
      `/payments/${id}/captures`,
      { amount: request.amount.minor, reference: request.reference },
      { idempotencyKey: `capture:${request.reference}` },
    );
    return { providerRef: id, status: PaymentStatus.Captured, amount: request.amount };
  }

  async void(target: PaymentTarget): Promise<ProviderPayment> {
    const payment = await this.lookup(target);
    if (payment === null)
      throw InvalidPaymentTransitionError.create({
        reference: target.reference,
        status: PaymentStatus.Failed,
        operation: "void",
      });
    await this.api.post(
      `/payments/${payment.providerRef}/voids`,
      { reference: `void:${target.reference}` },
      { idempotencyKey: `void:${target.reference}` },
    );
    return { ...payment, status: PaymentStatus.Voided };
  }

  async refund(request: RefundRequest): Promise<TransferResult> {
    const id = await this.paymentIdOf(request.payment, "refund");
    const accepted = await this.api.post<{ readonly action_id: string }>(
      `/payments/${id}/refunds`,
      { amount: request.amount.minor, reference: request.reference },
      { idempotencyKey: `refund:${request.reference}` },
    );
    return { providerRef: accepted.action_id, status: TransferStatus.Pending };
  }

  async dispute(providerRef: string): Promise<Dispute> {
    return this.disputeOf(await this.api.get<CkoDispute>(`/disputes/${providerRef}`));
  }

  async respond(providerRef: string, evidence: DisputeEvidence): Promise<Dispute> {
    await this.api.put(`/disputes/${providerRef}/evidence`, {
      additional_evidence_text: evidence.text,
      ...(evidence.files?.[0] === undefined ? {} : { additional_evidence_file: evidence.files[0] }),
    });
    await this.api.post(`/disputes/${providerRef}/evidence`);
    return this.dispute(providerRef);
  }

  async accept(providerRef: string): Promise<Dispute> {
    await this.api.post(`/disputes/${providerRef}/accept`);
    return this.dispute(providerRef);
  }

  /**
   * The `pay_` id behind `target`.
   *
   * @throws InvalidPaymentTransitionError when nobody has paid yet.
   */
  private async paymentIdOf(target: PaymentTarget, operation: string): Promise<string> {
    if (target.providerRef?.startsWith("pay_") === true) return target.providerRef;
    const payment = await this.lookup(target);
    if (payment === null)
      throw InvalidPaymentTransitionError.create({
        reference: target.reference,
        status: PaymentStatus.Pending,
        operation,
      });
    return payment.providerRef;
  }

  /** A Checkout.com payment as a `ProviderPayment`. */
  private paymentOf(payment: CkoPayment): ProviderPayment {
    return {
      providerRef: payment.id,
      status: STATUSES[payment.status] ?? PaymentStatus.Pending,
      amount: Money.ofMinor(payment.amount, payment.currency),
    };
  }

  /** A Checkout.com dispute as a `Dispute`. */
  private disputeOf(dispute: CkoDispute): Dispute {
    return {
      providerRef: dispute.id,
      paymentRef: dispute.payment_id,
      amount: Money.ofMinor(dispute.amount, dispute.currency),
      reason: dispute.reason_code,
      status: DISPUTE_STATUSES[dispute.status] ?? DisputeStatus.UnderReview,
      ...(dispute.evidence_required_by === undefined
        ? {}
        : { respondBy: new Date(dispute.evidence_required_by) }),
    };
  }
}
