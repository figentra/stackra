/**
 * Stackra file contract:
 * Purpose: `TamaraConnection`, one Tamara merchant and its payments driver: a checkout for the connection's payment
 *          type, lookup by order id or by the merchant reference, capture (authorising an approved order first),
 *          cancel (void) and refund.
 * Boundary: every call goes through `this.api`. Tamara needs the buyer's name, phone and shipping address; without
 *           them the checkout is refused, never defaulted. The payment type and instalment count are the
 *           connection's fields (data), never values here. The request carries tax-inclusive totals only, so the
 *           order's tax and shipping lines are sent as zero.
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
import type { PaymentConnectionMode } from "#contracts/types/payment-connection-mode.type";
import type { PaymentGateway } from "#contracts/types/payment-gateway.type";
import type { PaymentTarget } from "#contracts/types/payment-target.type";
import type { ProviderPayment } from "#contracts/types/provider-payment.type";
import type { RefundRequest } from "#contracts/types/refund-request.type";
import type { TransferResult } from "#contracts/types/transfer-result.type";
import { InvalidPaymentTransitionError } from "#core/errors/invalid-payment-transition.error";
import { PaymentFieldRequiredError } from "#core/errors/payment-field-required.error";
import { totalOf } from "#core/functions/total-of.function";
import type { TamaraIntegration } from "#core/providers/tamara/tamara.integration";

/** A Tamara amount. */
interface TamaraAmount {
  readonly amount: number;
  readonly currency: string;
}

/** A Tamara order, the fields the driver reads. */
interface TamaraOrder {
  readonly order_id: string;
  readonly status: string;
  readonly total_amount: TamaraAmount;
}

/** Tamara's order states as `PaymentStatus`. */
const STATUSES: Readonly<Record<string, PaymentStatus>> = {
  new: PaymentStatus.Pending,
  updated: PaymentStatus.Pending,
  approved: PaymentStatus.Authorized,
  authorised: PaymentStatus.Authorized,
  partially_captured: PaymentStatus.Captured,
  fully_captured: PaymentStatus.Captured,
  partially_refunded: PaymentStatus.PartiallyRefunded,
  fully_refunded: PaymentStatus.Refunded,
  canceled: PaymentStatus.Voided,
  declined: PaymentStatus.Failed,
  expired: PaymentStatus.Failed,
};

/** `money` as Tamara writes an amount: a number in major units. */
const amountOf = (money: Money): TamaraAmount => ({
  amount: Number(money.toDecimal()),
  currency: money.currency,
});

/**
 * A Tamara merchant, as tenant or platform.
 *
 * @example
 * const session = await connection.checkout(request);
 */
export class TamaraConnection
  extends Connection<TamaraIntegration>
  implements PaymentGateway, CaptureGateway
{
  /** The merchant API token. */
  @Secret("TAMARA_API_TOKEN")
  apiToken!: string;

  /** The Tamara payment type offered at checkout (`PAY_BY_INSTALMENTS`, `PAY_NOW`). */
  paymentType!: string;

  /** The instalment count, for a type that takes one. */
  instalments?: number;

  /** The carrier name Tamara records at capture, when the merchant ships. */
  shippingCompany?: string;

  /** How the connection reaches the money; `own-key` when absent. */
  mode?: PaymentConnectionMode;

  /** The Integration's provider code. */
  get provider(): string {
    return "tamara";
  }

  /** Hosted checkout; Tamara authorises first, so capture and void. */
  get capabilities(): readonly PaymentCapability[] {
    return [PaymentCapability.Checkout, PaymentCapability.Capture];
  }

  async check(): Promise<ConnectedAccount> {
    try {
      await this.api.get("/merchants/orders/reference-id/stackra-connection-check");
    } catch (error) {
      if (!ProviderRefusedError.is(error, { status: 404 })) throw error;
    }
    return ConnectedAccount.create({ id: this.id });
  }

  async checkout(request: CheckoutRequest): Promise<CheckoutSession> {
    const customer = request.customer;
    const address = customer?.address;
    if (address === undefined)
      throw PaymentFieldRequiredError.create({
        provider: this.provider,
        field: "customer.address",
      });
    if (customer?.phone === undefined)
      throw PaymentFieldRequiredError.create({ provider: this.provider, field: "customer.phone" });
    if (customer.name === undefined)
      throw PaymentFieldRequiredError.create({ provider: this.provider, field: "customer.name" });
    const [firstName = customer.name, ...rest] = customer.name.trim().split(/\s+/);
    const lastName = rest.join(" ") || firstName;
    const total = totalOf(request);
    const zero = amountOf(Money.zero(total.currency));
    const lines = request.lines ?? [];
    const created = await this.api.post<{
      readonly order_id: string;
      readonly checkout_url: string;
    }>("/checkout", {
      order_reference_id: request.reference,
      order_number: request.reference,
      total_amount: amountOf(total),
      description: request.description,
      country_code: address.country,
      payment_type: this.paymentType,
      ...(this.instalments === undefined ? {} : { instalments: this.instalments }),
      locale: request.locale?.startsWith("ar") === true ? "ar_SA" : "en_US",
      items: (lines.length > 0
        ? lines
        : [{ name: request.description, quantity: 1, unitPrice: total, sku: request.reference }]
      ).map((line) => ({
        name: line.name,
        type: "Physical",
        reference_id: line.sku ?? line.name,
        sku: line.sku ?? line.name,
        quantity: line.quantity,
        unit_price: amountOf(line.unitPrice),
        total_amount: amountOf(line.unitPrice.times(line.quantity)),
      })),
      consumer: {
        first_name: firstName,
        last_name: lastName,
        phone_number: customer.phone,
        ...(customer.email === undefined ? {} : { email: customer.email }),
      },
      shipping_address: {
        first_name: firstName,
        last_name: lastName,
        line1: address.line1,
        city: address.city,
        country_code: address.country,
        ...(address.postalCode === undefined ? {} : { postal_code: address.postalCode }),
      },
      tax_amount: zero,
      shipping_amount: zero,
      merchant_url: {
        success: request.returnUrl,
        failure: request.cancelUrl,
        cancel: request.cancelUrl,
      },
    });
    return { providerRef: created.order_id, kind: SessionKind.Redirect, url: created.checkout_url };
  }

  async lookup(target: PaymentTarget): Promise<ProviderPayment | null> {
    const order = await this.order(target);
    return order === null ? null : this.paymentOf(order);
  }

  async capture(request: CaptureRequest): Promise<ProviderPayment> {
    const order = await this.required(request.payment, "capture");
    if (order.status === "approved") await this.api.post(`/orders/${order.order_id}/authorise`);
    await this.api.post("/payments/capture", {
      order_id: order.order_id,
      total_amount: amountOf(request.amount),
      ...(this.shippingCompany === undefined
        ? {}
        : {
            shipping_info: {
              shipped_at: new Date().toISOString(),
              shipping_company: this.shippingCompany,
            },
          }),
    });
    return this.paymentOf(await this.required(request.payment, "capture"));
  }

  async void(target: PaymentTarget): Promise<ProviderPayment> {
    const order = await this.required(target, "void");
    await this.api.post(`/orders/${order.order_id}/cancel`, { total_amount: order.total_amount });
    return { ...this.paymentOf(order), status: PaymentStatus.Voided };
  }

  async refund(request: RefundRequest): Promise<TransferResult> {
    const order = await this.required(request.payment, "refund");
    const refund = await this.api.post<{ readonly refund_id: string }>(
      `/payments/simplified-refund/${order.order_id}`,
      { total_amount: amountOf(request.amount), comment: request.reason ?? request.reference },
    );
    return { providerRef: refund.refund_id, status: TransferStatus.Succeeded };
  }

  /** The order of `target`, by id or by the merchant reference; null when Tamara holds none. */
  private async order(target: PaymentTarget): Promise<TamaraOrder | null> {
    if (target.providerRef !== undefined)
      return this.api.get<TamaraOrder>(`/orders/${target.providerRef}`);
    try {
      return await this.api.get<TamaraOrder>(
        `/merchants/orders/reference-id/${encodeURIComponent(target.reference)}`,
      );
    } catch (error) {
      if (ProviderRefusedError.is(error, { status: 404 })) return null;
      throw error;
    }
  }

  /**
   * The order of `target`.
   *
   * @throws InvalidPaymentTransitionError when Tamara holds none.
   */
  private async required(target: PaymentTarget, operation: string): Promise<TamaraOrder> {
    const order = await this.order(target);
    if (order === null)
      throw InvalidPaymentTransitionError.create({
        reference: target.reference,
        status: PaymentStatus.Failed,
        operation,
      });
    return order;
  }

  /** A Tamara order as a `ProviderPayment`. */
  private paymentOf(order: TamaraOrder): ProviderPayment {
    return {
      providerRef: order.order_id,
      status: STATUSES[order.status] ?? PaymentStatus.Pending,
      amount: Money.of(String(order.total_amount.amount), order.total_amount.currency),
    };
  }
}
