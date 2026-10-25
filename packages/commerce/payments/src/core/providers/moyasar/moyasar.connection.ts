/**
 * Stackra file contract:
 * Purpose: `MoyasarConnection`, one Moyasar account and its payments driver: hosted invoices for checkout and pay
 *          links, lookup by invoice, payment or metadata reference, capture, void and refund of a payment, and
 *          charges on a saved Moyasar token.
 * Boundary: every call goes through `this.api`. An invoice id is kept as `invoice:<id>` so a later call knows to read
 *           the invoice's payments; a payment id is kept bare. Moyasar has no idempotency header, so a lost POST is
 *           resolved by the lookup on the `reference` metadata. The callback URL a token charge needs is the
 *           connection's `callbackUrl` field.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decisions 2, 5 and 6); ADR 0356 (decision 2); ADR 0308 (rules 2 and 13).
 */
import { Secret } from "@stackra/config";
import { ConnectedAccount, Connection } from "@stackra/integrations";
import { Money } from "@stackra/money";

import { ChargeInitiator } from "#contracts/enums/charge-initiator.enum";
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
import type { TokenCharge } from "#contracts/types/token-charge.type";
import type { TokenGateway } from "#contracts/types/token-gateway.type";
import type { TransferResult } from "#contracts/types/transfer-result.type";
import { InvalidPaymentTransitionError } from "#core/errors/invalid-payment-transition.error";
import { totalOf } from "#core/functions/total-of.function";
import type { MoyasarIntegration } from "#core/providers/moyasar/moyasar.integration";

/** The prefix that marks an invoice id among provider refs. */
const INVOICE = "invoice:";

/** A Moyasar payment, the fields the driver reads. */
interface MoyasarPayment {
  readonly id: string;
  readonly status: string;
  readonly amount: number;
  readonly refunded: number;
  readonly currency: string;
}

/** A Moyasar invoice, the fields the driver reads. */
interface MoyasarInvoice {
  readonly id: string;
  readonly status: string;
  readonly amount: number;
  readonly currency: string;
  readonly url: string;
  readonly expired_at?: string | null;
  readonly payments?: readonly MoyasarPayment[];
}

/** Moyasar's payment states as `PaymentStatus`; `refunded` is split by amount. */
const STATUSES: Readonly<Record<string, PaymentStatus>> = {
  initiated: PaymentStatus.Pending,
  authorized: PaymentStatus.Authorized,
  paid: PaymentStatus.Captured,
  captured: PaymentStatus.Captured,
  voided: PaymentStatus.Voided,
  failed: PaymentStatus.Failed,
};

/** Moyasar's invoice states before any payment as `PaymentStatus`. */
const INVOICE_STATUSES: Readonly<Record<string, PaymentStatus>> = {
  initiated: PaymentStatus.Pending,
  expired: PaymentStatus.Failed,
  canceled: PaymentStatus.Voided,
  failed: PaymentStatus.Failed,
};

/**
 * A Moyasar account, as tenant or platform.
 *
 * @example
 * const session = await connection.checkout(request);
 */
export class MoyasarConnection
  extends Connection<MoyasarIntegration>
  implements PaymentGateway, CaptureGateway, TokenGateway
{
  /** The account's secret key (`sk_live_…` or `sk_test_…`). */
  @Secret("MOYASAR_SECRET_KEY")
  secretKey!: string;

  /** Where Moyasar returns a customer after a token charge that asks for 3-D Secure. */
  callbackUrl!: string;

  /** The Basic credential Moyasar expects: the secret key and an empty password, base64. */
  get basicCredential(): string {
    return btoa(`${this.secretKey}:`);
  }

  /** The Integration's provider code. */
  get provider(): string {
    return "moyasar";
  }

  /** Hosted invoices, capture and void, saved tokens. */
  get capabilities(): readonly PaymentCapability[] {
    return [PaymentCapability.Checkout, PaymentCapability.Capture, PaymentCapability.Tokens];
  }

  async check(): Promise<ConnectedAccount> {
    await this.api.get("/v1/payments", { query: { page: 1 } });
    return ConnectedAccount.create({ id: this.id });
  }

  async checkout(request: CheckoutRequest): Promise<CheckoutSession> {
    const total = totalOf(request);
    const invoice = await this.api.post<MoyasarInvoice>("/v1/invoices", {
      amount: total.minor,
      currency: total.currency,
      description: request.description,
      success_url: request.returnUrl,
      back_url: request.cancelUrl,
      metadata: { reference: request.reference },
      ...(request.expiresAt === undefined ? {} : { expired_at: request.expiresAt.toISOString() }),
    });
    return {
      providerRef: `${INVOICE}${invoice.id}`,
      kind: SessionKind.Redirect,
      url: invoice.url,
      ...(invoice.expired_at == null ? {} : { expiresAt: new Date(invoice.expired_at) }),
    };
  }

  async lookup(target: PaymentTarget): Promise<ProviderPayment | null> {
    const ref = target.providerRef;
    if (ref?.startsWith(INVOICE) === true) {
      const invoice = await this.api.get<MoyasarInvoice>(
        `/v1/invoices/${ref.slice(INVOICE.length)}`,
      );
      const paid = invoice.payments?.find((payment) => payment.status !== "failed");
      if (paid !== undefined) return this.paymentOf(paid);
      return {
        providerRef: ref,
        status: INVOICE_STATUSES[invoice.status] ?? PaymentStatus.Pending,
        amount: Money.ofMinor(invoice.amount, invoice.currency),
      };
    }
    if (ref !== undefined)
      return this.paymentOf(await this.api.get<MoyasarPayment>(`/v1/payments/${ref}`));
    const found = await this.api.get<{ readonly payments: readonly MoyasarPayment[] }>(
      "/v1/payments",
      { query: { "metadata[reference]": target.reference } },
    );
    const payment = found.payments[0];
    return payment === undefined ? null : this.paymentOf(payment);
  }

  async capture(request: CaptureRequest): Promise<ProviderPayment> {
    const id = await this.paymentIdOf(request.payment, "capture");
    return this.paymentOf(
      await this.api.post<MoyasarPayment>(`/v1/payments/${id}/capture`, {
        amount: request.amount.minor,
      }),
    );
  }

  async void(target: PaymentTarget): Promise<ProviderPayment> {
    const id = await this.paymentIdOf(target, "void");
    return this.paymentOf(await this.api.post<MoyasarPayment>(`/v1/payments/${id}/void`));
  }

  async refund(request: RefundRequest): Promise<TransferResult> {
    const id = await this.paymentIdOf(request.payment, "refund");
    const payment = await this.api.post<MoyasarPayment>(`/v1/payments/${id}/refund`, {
      amount: request.amount.minor,
    });
    return { providerRef: payment.id, status: TransferStatus.Succeeded };
  }

  async charge(request: TokenCharge): Promise<ProviderPayment> {
    const payment = await this.api.post<MoyasarPayment>("/v1/payments", {
      amount: request.amount.minor,
      currency: request.amount.currency,
      description: request.description ?? request.reference,
      callback_url: this.callbackUrl,
      metadata: { reference: request.reference },
      source: {
        type: "token",
        token: request.method.token,
        "3ds": request.initiator === ChargeInitiator.Customer,
      },
    });
    return this.paymentOf(payment);
  }

  /**
   * The payment id behind `target`, reading the invoice's payment when the target is an invoice.
   *
   * @throws InvalidPaymentTransitionError when the invoice holds no payment yet.
   */
  private async paymentIdOf(target: PaymentTarget, operation: string): Promise<string> {
    if (target.providerRef !== undefined && !target.providerRef.startsWith(INVOICE))
      return target.providerRef;
    const payment = await this.lookup(target);
    if (payment === null || payment.providerRef.startsWith(INVOICE))
      throw InvalidPaymentTransitionError.create({
        reference: target.reference,
        status: payment?.status ?? PaymentStatus.Failed,
        operation,
      });
    return payment.providerRef;
  }

  /** A Moyasar payment as a `ProviderPayment`. */
  private paymentOf(payment: MoyasarPayment): ProviderPayment {
    const status =
      payment.status === "refunded" || (payment.refunded > 0 && payment.status === "paid")
        ? payment.refunded >= payment.amount
          ? PaymentStatus.Refunded
          : PaymentStatus.PartiallyRefunded
        : (STATUSES[payment.status] ?? PaymentStatus.Pending);
    return {
      providerRef: payment.id,
      status,
      amount: Money.ofMinor(payment.amount, payment.currency),
    };
  }
}
