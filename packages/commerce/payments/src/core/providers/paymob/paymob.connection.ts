/**
 * Stackra file contract:
 * Purpose: `PaymobConnection`, one Paymob account and its payments driver: an Intention opened on the Unified
 *          Checkout for the connection's payment-method integrations, lookup by the merchant reference
 *          (transaction inquiry), capture, void and refund of the transaction.
 * Boundary: every call goes through `this.api`. Which payment methods show (cards, wallets, kiosk, instalments) is
 *           the connection's `integrationIds` field (data). Paymob needs the buyer's name, email and phone for its
 *           billing data; without them the checkout is refused, never filled with placeholders. Paymob has no
 *           idempotency header; a lost POST is resolved by the inquiry on the reference.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decisions 2 and 6); ADR 0356 (decision 2); ADR 0308 (rules 2 and 13).
 */
import { Secret } from "@stackra/config";
import { ConnectedAccount, Connection, ProviderRefusedError } from "@stackra/integrations";
import { Money } from "@stackra/money";

import { PaymentCapability } from "#contracts/enums/payment-capability.enum";
import { PaymentStatus } from "#contracts/enums/payment-status.enum";
import { SessionKind } from "#contracts/enums/session-kind.enum";
import { TransferStatus } from "#contracts/enums/transfer-status.enum";
import type { CaptureGateway } from "#contracts/types/capture-gateway.type";
import type { CaptureRequest } from "#contracts/types/capture-request.type";
import type { CheckoutRequest } from "#contracts/types/checkout-request.type";
import type { CheckoutSession } from "#contracts/types/checkout-session.type";
import type { PaymentGateway } from "#contracts/types/payment-gateway.type";
import type { PaymentTarget } from "#contracts/types/payment-target.type";
import type { ProviderPayment } from "#contracts/types/provider-payment.type";
import type { RefundRequest } from "#contracts/types/refund-request.type";
import type { TransferResult } from "#contracts/types/transfer-result.type";
import { InvalidPaymentTransitionError } from "#core/errors/invalid-payment-transition.error";
import { PaymentFieldRequiredError } from "#core/errors/payment-field-required.error";
import { totalOf } from "#core/functions/total-of.function";
import type { PaymobIntegration } from "#core/providers/paymob/paymob.integration";

/** The Unified Checkout page, on the Integration's host. */
const UNIFIED_CHECKOUT = "https://accept.paymob.com/unifiedcheckout/";

/** A Paymob transaction, the fields the driver reads. */
interface PaymobTransaction {
  readonly id: number;
  readonly success: boolean;
  readonly pending: boolean;
  readonly is_auth?: boolean;
  readonly is_capture?: boolean;
  readonly is_voided?: boolean;
  readonly amount_cents: number;
  readonly refunded_amount_cents?: number;
  readonly captured_amount?: number;
  readonly currency: string;
}

/** A Paymob intention, the fields the driver reads. */
interface PaymobIntention {
  readonly id: string;
  readonly client_secret: string;
}

/**
 * A Paymob account, as tenant or platform.
 *
 * @example
 * const session = await connection.checkout(request);
 */
export class PaymobConnection
  extends Connection<PaymobIntegration>
  implements PaymentGateway, CaptureGateway
{
  /** The account's secret key. */
  @Secret("PAYMOB_SECRET_KEY")
  secretKey!: string;

  /** The account's public key, which the Unified Checkout URL carries. */
  publicKey!: string;

  /** The payment-method integration ids offered at checkout. */
  integrationIds!: readonly number[];

  /** Where Paymob posts the transaction callback, when the host receives one. */
  notificationUrl?: string;

  /** The Integration's provider code. */
  get provider(): string {
    return "paymob";
  }

  /** Hosted checkout, capture and void (on auth-mode integrations). */
  get capabilities(): readonly PaymentCapability[] {
    return [PaymentCapability.Checkout, PaymentCapability.Capture];
  }

  async check(): Promise<ConnectedAccount> {
    await this.inquiry("stackra-connection-check");
    return ConnectedAccount.create({ id: this.publicKey });
  }

  async checkout(request: CheckoutRequest): Promise<CheckoutSession> {
    const customer = request.customer;
    for (const field of ["name", "email", "phone"] as const)
      if (customer?.[field] === undefined)
        throw PaymentFieldRequiredError.create({
          provider: this.provider,
          field: `customer.${field}`,
        });
    const [firstName = "", ...rest] = (customer?.name ?? "").trim().split(/\s+/);
    const total = totalOf(request);
    const intention = await this.api.post<PaymobIntention>("/v1/intention/", {
      amount: total.minor,
      currency: total.currency,
      payment_methods: this.integrationIds,
      items: [
        {
          name: request.description,
          amount: total.minor,
          description: request.description,
          quantity: 1,
        },
      ],
      billing_data: {
        first_name: firstName,
        last_name: rest.join(" ") || firstName,
        email: customer?.email,
        phone_number: customer?.phone,
        ...(customer?.address === undefined
          ? {}
          : {
              street: customer.address.line1,
              city: customer.address.city,
              country: customer.address.country,
            }),
      },
      special_reference: request.reference,
      redirection_url: request.returnUrl,
      ...(this.notificationUrl === undefined ? {} : { notification_url: this.notificationUrl }),
    });
    const url = new URL(UNIFIED_CHECKOUT);
    url.searchParams.set("publicKey", this.publicKey);
    url.searchParams.set("clientSecret", intention.client_secret);
    return { providerRef: intention.id, kind: SessionKind.Redirect, url: url.toString() };
  }

  async lookup(target: PaymentTarget): Promise<ProviderPayment | null> {
    const transaction = await this.inquiry(target.reference);
    return transaction === null ? null : this.paymentOf(transaction);
  }

  async capture(request: CaptureRequest): Promise<ProviderPayment> {
    const transaction = await this.api.post<PaymobTransaction>("/api/acceptance/capture", {
      transaction_id: await this.transactionIdOf(request.payment, "capture"),
      amount_cents: request.amount.minor,
    });
    return this.paymentOf(transaction);
  }

  async void(target: PaymentTarget): Promise<ProviderPayment> {
    const transaction = await this.api.post<PaymobTransaction>("/api/acceptance/void_refund/void", {
      transaction_id: await this.transactionIdOf(target, "void"),
    });
    return { ...this.paymentOf(transaction), status: PaymentStatus.Voided };
  }

  async refund(request: RefundRequest): Promise<TransferResult> {
    const transaction = await this.api.post<PaymobTransaction>(
      "/api/acceptance/void_refund/refund",
      {
        transaction_id: await this.transactionIdOf(request.payment, "refund"),
        amount_cents: request.amount.minor,
      },
    );
    return {
      providerRef: String(transaction.id),
      status: transaction.success ? TransferStatus.Succeeded : TransferStatus.Failed,
    };
  }

  /** The transaction of the merchant `reference`, or null when Paymob holds none. */
  private async inquiry(reference: string): Promise<PaymobTransaction | null> {
    try {
      return await this.api.post<PaymobTransaction>("/api/ecommerce/orders/transaction_inquiry", {
        merchant_order_id: reference,
      });
    } catch (error) {
      if (ProviderRefusedError.is(error, { status: 404 })) return null;
      throw error;
    }
  }

  /**
   * The numeric transaction id behind `target`.
   *
   * @throws InvalidPaymentTransitionError when nobody has paid yet.
   */
  private async transactionIdOf(target: PaymentTarget, operation: string): Promise<number> {
    if (target.providerRef !== undefined && /^\d+$/.test(target.providerRef))
      return Number(target.providerRef);
    const transaction = await this.inquiry(target.reference);
    if (transaction === null)
      throw InvalidPaymentTransitionError.create({
        reference: target.reference,
        status: PaymentStatus.Pending,
        operation,
      });
    return transaction.id;
  }

  /** A Paymob transaction as a `ProviderPayment`. */
  private paymentOf(transaction: PaymobTransaction): ProviderPayment {
    const refunded = transaction.refunded_amount_cents ?? 0;
    let status: PaymentStatus;
    if (transaction.pending) status = PaymentStatus.Pending;
    else if (!transaction.success) status = PaymentStatus.Failed;
    else if (transaction.is_voided === true) status = PaymentStatus.Voided;
    else if (refunded > 0)
      status =
        refunded >= transaction.amount_cents
          ? PaymentStatus.Refunded
          : PaymentStatus.PartiallyRefunded;
    else if (transaction.is_auth === true && (transaction.captured_amount ?? 0) === 0)
      status = PaymentStatus.Authorized;
    else status = PaymentStatus.Captured;
    return {
      providerRef: String(transaction.id),
      status,
      amount: Money.ofMinor(transaction.amount_cents, transaction.currency),
    };
  }
}
