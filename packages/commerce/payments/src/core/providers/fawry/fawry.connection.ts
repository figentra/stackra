/**
 * Stackra file contract:
 * Purpose: `FawryConnection`, one FawryPay merchant and its payments driver: an Express Checkout page (cards,
 *          wallets and the Fawry reference paid at an outlet), status lookup by the merchant reference, and refunds.
 * Boundary: every call goes through `this.api` and is signed here with `sha256Hex` over Fawry's documented field
 *           order and the secure key; the key is read blind from the connection and never logged or returned. Fawry
 *           takes payment at once, so there is no capture or void. The currency Fawry settles in is the connection's
 *           `currency` field (data). A refusal Fawry reports in the body (`statusCode` other than 200) becomes
 *           `ProviderRefusedError` with that code.
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
import type { CheckoutRequest } from "#contracts/types/checkout-request.type";
import type { CheckoutSession } from "#contracts/types/checkout-session.type";
import type { PaymentGateway } from "#contracts/types/payment-gateway.type";
import type { PaymentTarget } from "#contracts/types/payment-target.type";
import type { ProviderPayment } from "#contracts/types/provider-payment.type";
import type { RefundRequest } from "#contracts/types/refund-request.type";
import type { TransferResult } from "#contracts/types/transfer-result.type";
import { InvalidPaymentTransitionError } from "#core/errors/invalid-payment-transition.error";
import { sha256Hex } from "#core/functions/sha256-hex.function";
import { totalOf } from "#core/functions/total-of.function";
import type { FawryIntegration } from "#core/providers/fawry/fawry.integration";

/** A FawryPay status answer, the fields the driver reads. */
interface FawryStatus {
  readonly statusCode: number;
  readonly referenceNumber?: string;
  readonly merchantRefNumber?: string;
  readonly paymentAmount?: number;
  readonly orderAmount?: number;
  readonly orderStatus?: string;
}

/** Fawry's order states as `PaymentStatus`. */
const STATUSES: Readonly<Record<string, PaymentStatus>> = {
  NEW: PaymentStatus.Pending,
  UNPAID: PaymentStatus.Pending,
  PAID: PaymentStatus.Captured,
  PARTIAL_REFUNDED: PaymentStatus.PartiallyRefunded,
  REFUNDED: PaymentStatus.Refunded,
  CANCELED: PaymentStatus.Voided,
  CANCELLED: PaymentStatus.Voided,
  EXPIRED: PaymentStatus.Failed,
  FAILED: PaymentStatus.Failed,
};

/**
 * A FawryPay merchant, as tenant or platform.
 *
 * @example
 * const session = await connection.checkout(request);
 */
export class FawryConnection extends Connection<FawryIntegration> implements PaymentGateway {
  /** The merchant code Fawry issued. */
  merchantCode!: string;

  /** The secure key every signature ends with. */
  @Secret("FAWRY_SECURE_KEY")
  secureKey!: string;

  /** The ISO 4217 currency the merchant settles in. */
  currency!: string;

  /** The Integration's provider code. */
  get provider(): string {
    return "fawry";
  }

  /** Hosted checkout only; Fawry takes payment at once. */
  get capabilities(): readonly PaymentCapability[] {
    return [PaymentCapability.Checkout];
  }

  async check(): Promise<ConnectedAccount> {
    await this.status("stackra-connection-check");
    return ConnectedAccount.create({ id: this.merchantCode });
  }

  async checkout(request: CheckoutRequest): Promise<CheckoutSession> {
    const total = totalOf(request);
    const item = {
      itemId: request.reference,
      description: request.description,
      price: Number(total.toDecimal()),
      quantity: 1,
    };
    const signature = await sha256Hex(
      `${this.merchantCode}${request.reference}${request.returnUrl}${item.itemId}${item.quantity}${total.toDecimal()}${this.secureKey}`,
    );
    const url = await this.api.post<string>("/fawrypay-api/api/payments/init", {
      merchantCode: this.merchantCode,
      merchantRefNum: request.reference,
      customerProfileId: "",
      ...(request.customer?.phone === undefined ? {} : { customerMobile: request.customer.phone }),
      ...(request.customer?.email === undefined ? {} : { customerEmail: request.customer.email }),
      ...(request.customer?.name === undefined ? {} : { customerName: request.customer.name }),
      language: request.locale?.startsWith("ar") === true ? "ar-eg" : "en-gb",
      chargeItems: [item],
      returnUrl: request.returnUrl,
      authCaptureModePayment: false,
      ...(request.expiresAt === undefined ? {} : { paymentExpiry: request.expiresAt.getTime() }),
      signature,
    });
    return {
      providerRef: request.reference,
      kind: SessionKind.Redirect,
      url,
      ...(request.expiresAt === undefined ? {} : { expiresAt: request.expiresAt }),
    };
  }

  async lookup(target: PaymentTarget): Promise<ProviderPayment | null> {
    const status = await this.status(target.reference);
    if (status.orderStatus === undefined) return null;
    return {
      providerRef: status.referenceNumber ?? target.reference,
      status: STATUSES[status.orderStatus] ?? PaymentStatus.Pending,
      amount: Money.of(String(status.orderAmount ?? status.paymentAmount ?? 0), this.currency),
    };
  }

  async refund(request: RefundRequest): Promise<TransferResult> {
    const status = await this.status(request.payment.reference);
    if (status.referenceNumber === undefined)
      throw InvalidPaymentTransitionError.create({
        reference: request.payment.reference,
        status: PaymentStatus.Pending,
        operation: "refund",
      });
    const amount = request.amount.toDecimal();
    const reason = request.reason ?? request.reference;
    const answer = await this.api.post<FawryStatus>("/ECommerceWeb/Fawry/payments/refund", {
      merchantCode: this.merchantCode,
      referenceNumber: status.referenceNumber,
      refundAmount: Number(amount),
      reason,
      signature: await sha256Hex(
        `${this.merchantCode}${status.referenceNumber}${amount}${reason}${this.secureKey}`,
      ),
    });
    this.ensure(answer);
    return {
      providerRef: `${status.referenceNumber}:${request.reference}`,
      status: TransferStatus.Succeeded,
    };
  }

  /** Fawry's status of the merchant `reference`. */
  private async status(reference: string): Promise<FawryStatus> {
    return this.api.get<FawryStatus>("/ECommerceWeb/Fawry/payments/status/v2", {
      query: {
        merchantCode: this.merchantCode,
        merchantRefNumber: reference,
        signature: await sha256Hex(`${this.merchantCode}${reference}${this.secureKey}`),
      },
    });
  }

  /** Throws `ProviderRefusedError` when Fawry refused in the body. */
  private ensure(answer: FawryStatus): void {
    if (answer.statusCode !== 200)
      throw ProviderRefusedError.create({
        provider: this.provider,
        status: 422,
        code: String(answer.statusCode),
      });
  }
}
