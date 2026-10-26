/**
 * Stackra file contract:
 * Purpose: `TabbyConnection`, one Tabby merchant and its payments driver: a checkout session (refused up front when
 *          Tabby's pre-scoring rejects the buyer), lookup, capture, close (void) and refund of the payment.
 * Boundary: every call goes through `this.api`. Tabby always authorises first, so the engine captures (on its own
 *           schedule) whatever the checkout asked. Tabby needs the buyer's phone and email; without them the checkout
 *           is refused, never defaulted. Amounts travel as decimal strings.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decisions 2 and 6); ADR 0356 (decision 2); ADR 0308 (rules 2 and 13).
 */
import { Secret } from "@stackra/config";
import { ConnectedAccount, Connection } from "@stackra/integrations";
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
import { PaymentDeclinedError } from "#core/errors/payment-declined.error";
import { PaymentFieldRequiredError } from "#core/errors/payment-field-required.error";
import { totalOf } from "#core/functions/total-of.function";
import type { TabbyIntegration } from "#core/providers/tabby/tabby.integration";

/** A Tabby capture or refund line. */
interface TabbyMovement {
  readonly id: string;
  readonly amount: string;
}

/** A Tabby payment, the fields the driver reads. */
interface TabbyPayment {
  readonly id: string;
  readonly status: string;
  readonly amount: string;
  readonly currency: string;
  readonly captures?: readonly TabbyMovement[];
  readonly refunds?: readonly TabbyMovement[];
}

/** A Tabby checkout session, the fields the driver reads. */
interface TabbySession {
  readonly id: string;
  readonly status: string;
  readonly payment: { readonly id: string };
  readonly configuration?: {
    readonly available_products?: {
      readonly installments?: readonly { readonly web_url: string }[];
    };
    readonly products?: { readonly installments?: { readonly rejection_reason?: string | null } };
  };
}

/** The sum of `movements` in `currency`. */
const sumOf = (movements: readonly TabbyMovement[] | undefined, currency: string): Money =>
  (movements ?? []).reduce(
    (sum, movement) => sum.plus(Money.of(movement.amount, currency)),
    Money.zero(currency),
  );

/**
 * A Tabby merchant, as tenant or platform.
 *
 * @example
 * const session = await connection.checkout(request);
 */
export class TabbyConnection
  extends Connection<TabbyIntegration>
  implements PaymentGateway, CaptureGateway
{
  /** The merchant's secret key. */
  @Secret("TABBY_SECRET_KEY")
  secretKey!: string;

  /** The merchant code Tabby issued for this store. */
  merchantCode!: string;

  /** How the connection reaches the money; `own-key` when absent. */
  mode?: PaymentConnectionMode;

  /** The Integration's provider code. */
  get provider(): string {
    return "tabby";
  }

  /** Hosted checkout; Tabby authorises first, so capture and void. */
  get capabilities(): readonly PaymentCapability[] {
    return [PaymentCapability.Checkout, PaymentCapability.Capture];
  }

  async check(): Promise<ConnectedAccount> {
    await this.api.get("/api/v2/payments", { query: { limit: 1 } });
    return ConnectedAccount.create({ id: this.merchantCode });
  }

  async checkout(request: CheckoutRequest): Promise<CheckoutSession> {
    const buyer = request.customer;
    if (buyer?.phone === undefined)
      throw PaymentFieldRequiredError.create({ provider: this.provider, field: "customer.phone" });
    if (buyer.email === undefined)
      throw PaymentFieldRequiredError.create({ provider: this.provider, field: "customer.email" });
    const total = totalOf(request);
    const items = (request.lines ?? []).map((line) => ({
      title: line.name,
      quantity: line.quantity,
      unit_price: line.unitPrice.toDecimal(),
      reference_id: line.sku ?? line.name,
    }));
    const session = await this.api.post<TabbySession>("/api/v2/checkout", {
      payment: {
        amount: total.toDecimal(),
        currency: total.currency,
        description: request.description,
        buyer: { phone: buyer.phone, email: buyer.email, name: buyer.name ?? buyer.email },
        order: {
          reference_id: request.reference,
          items:
            items.length > 0
              ? items
              : [
                  {
                    title: request.description,
                    quantity: 1,
                    unit_price: total.toDecimal(),
                    reference_id: request.reference,
                  },
                ],
        },
        ...(buyer.address === undefined
          ? {}
          : {
              shipping_address: {
                address: buyer.address.line1,
                city: buyer.address.city,
                zip: buyer.address.postalCode ?? "",
              },
            }),
      },
      lang: request.locale?.startsWith("ar") === true ? "ar" : "en",
      merchant_code: this.merchantCode,
      merchant_urls: {
        success: request.returnUrl,
        cancel: request.cancelUrl,
        failure: request.cancelUrl,
      },
    });
    const url = session.configuration?.available_products?.installments?.[0]?.web_url;
    if (session.status !== "created" || url === undefined) {
      const reason = session.configuration?.products?.installments?.rejection_reason;
      throw PaymentDeclinedError.create({
        provider: this.provider,
        ...(reason == null ? {} : { providerCode: reason }),
      });
    }
    return { providerRef: session.payment.id, kind: SessionKind.Redirect, url };
  }

  async lookup(target: PaymentTarget): Promise<ProviderPayment | null> {
    // Tabby cannot search by the merchant reference; with no payment id no customer could have paid.
    if (target.providerRef === undefined) return null;
    return this.paymentOf(
      await this.api.get<TabbyPayment>(`/api/v2/payments/${target.providerRef}`),
    );
  }

  async capture(request: CaptureRequest): Promise<ProviderPayment> {
    const payment = await this.api.post<TabbyPayment>(
      `/api/v2/payments/${this.idOf(request.payment)}/captures`,
      { amount: request.amount.toDecimal(), reference_id: request.reference },
    );
    return this.paymentOf(payment);
  }

  async void(target: PaymentTarget): Promise<ProviderPayment> {
    return this.paymentOf(
      await this.api.post<TabbyPayment>(`/api/v2/payments/${this.idOf(target)}/close`),
    );
  }

  async refund(request: RefundRequest): Promise<TransferResult> {
    const payment = await this.api.post<TabbyPayment>(
      `/api/v2/payments/${this.idOf(request.payment)}/refunds`,
      {
        amount: request.amount.toDecimal(),
        reference_id: request.reference,
        ...(request.reason === undefined ? {} : { reason: request.reason }),
      },
    );
    const last = payment.refunds?.at(-1);
    return { providerRef: last?.id ?? payment.id, status: TransferStatus.Succeeded };
  }

  /** The payment id of `target`; Tabby's checkout returns it, so it is always known after one. */
  private idOf(target: PaymentTarget): string {
    if (target.providerRef === undefined)
      throw PaymentFieldRequiredError.create({
        provider: this.provider,
        field: "payment.providerRef",
      });
    return target.providerRef;
  }

  /** A Tabby payment as a `ProviderPayment`. */
  private paymentOf(payment: TabbyPayment): ProviderPayment {
    const amount = Money.of(payment.amount, payment.currency);
    const captured = sumOf(payment.captures, payment.currency);
    const refunded = sumOf(payment.refunds, payment.currency);
    let status: PaymentStatus;
    if (payment.status === "CREATED") status = PaymentStatus.Pending;
    else if (payment.status === "REJECTED" || payment.status === "EXPIRED")
      status = PaymentStatus.Failed;
    else if (refunded.minor > 0)
      status =
        refunded.minor >= captured.minor ? PaymentStatus.Refunded : PaymentStatus.PartiallyRefunded;
    else if (captured.minor > 0) status = PaymentStatus.Captured;
    else status = payment.status === "CLOSED" ? PaymentStatus.Voided : PaymentStatus.Authorized;
    return { providerRef: payment.id, status, amount };
  }
}
