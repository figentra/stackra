/**
 * Stackra file contract:
 * Purpose: `HyperpayConnection`, one HyperPay entity and its payments driver: a COPYandPAY checkout (a widget script
 *          the product's page loads), lookup by checkout id or by the merchant reference, capture (CP), reversal (RV)
 *          and refund (RF) back-office operations, and charges on a saved registration, flagged as a
 *          merchant-initiated standing instruction when the merchant starts it.
 * Boundary: every call goes through `this.api`. Card data stays in HyperPay's widget (PCI SAQ-A). The payment amounts
 *           travel as decimal strings. The entity id is the connection's field.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decisions 2, 5 and 6); ADR 0356 (decision 2); ADR 0308 (rules 2 and 13).
 */
import { Secret } from "@stackra/config";
import { ConnectedAccount, Connection, ProviderRefusedError } from "@stackra/integrations";
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
import type { PaymentConnectionMode } from "#contracts/types/payment-connection-mode.type";
import type { PaymentGateway } from "#contracts/types/payment-gateway.type";
import type { PaymentTarget } from "#contracts/types/payment-target.type";
import type { ProviderPayment } from "#contracts/types/provider-payment.type";
import type { RefundRequest } from "#contracts/types/refund-request.type";
import type { TokenCharge } from "#contracts/types/token-charge.type";
import type { TokenGateway } from "#contracts/types/token-gateway.type";
import type { TransferResult } from "#contracts/types/transfer-result.type";
import { InvalidPaymentTransitionError } from "#core/errors/invalid-payment-transition.error";
import { totalOf } from "#core/functions/total-of.function";
import { hyperpayResult } from "#core/providers/hyperpay/hyperpay-result.function";
import type { HyperpayIntegration } from "#core/providers/hyperpay/hyperpay.integration";

/** One OPPWA transaction, the fields the driver reads. */
interface OppwaPayment {
  readonly id: string;
  readonly paymentType: string;
  readonly amount: string;
  readonly currency: string;
  readonly result: { readonly code: string };
  readonly registrationId?: string;
}

/**
 * A HyperPay entity, as tenant or platform.
 *
 * @example
 * const session = await connection.checkout(request); // session.kind === SessionKind.Widget
 */
export class HyperpayConnection
  extends Connection<HyperpayIntegration>
  implements PaymentGateway, CaptureGateway, TokenGateway
{
  /** The entity's access token. */
  @Secret("HYPERPAY_ACCESS_TOKEN")
  accessToken!: string;

  /** The entity id payments are booked on. */
  entityId!: string;

  /** How the connection reaches the money; `own-key` when absent. */
  mode?: PaymentConnectionMode;

  /** The Integration's provider code. */
  get provider(): string {
    return "hyperpay";
  }

  /** The host the widget script loads from: the Integration's own. */
  get origin(): string {
    return "https://eu-prod.oppwa.com";
  }

  /** Widget checkout, capture and reversal, saved registrations. */
  get capabilities(): readonly PaymentCapability[] {
    return [PaymentCapability.Checkout, PaymentCapability.Capture, PaymentCapability.Tokens];
  }

  async check(): Promise<ConnectedAccount> {
    try {
      await this.api.get("/v1/query", {
        query: { entityId: this.entityId, merchantTransactionId: "stackra-connection-check" },
      });
    } catch (error) {
      if (!ProviderRefusedError.is(error, { status: 400 })) throw error;
    }
    return ConnectedAccount.create({ id: this.entityId });
  }

  async checkout(request: CheckoutRequest): Promise<CheckoutSession> {
    const total = totalOf(request);
    const saving = request.saveMethod === true;
    const checkout = await this.api.post<{ readonly id: string }>("/v1/checkouts", {
      entityId: this.entityId,
      amount: total.toDecimal(),
      currency: total.currency,
      paymentType: request.captureLater === true ? "PA" : "DB",
      merchantTransactionId: request.reference,
      ...(request.customer?.email === undefined
        ? {}
        : { "customer.email": request.customer.email }),
      ...(request.customer?.name === undefined
        ? {}
        : { "customer.givenName": request.customer.name }),
      ...(saving
        ? {
            createRegistration: true,
            "standingInstruction.mode": "INITIAL",
            "standingInstruction.type": "UNSCHEDULED",
            "standingInstruction.source": "CIT",
          }
        : {}),
    });
    return {
      providerRef: checkout.id,
      kind: SessionKind.Widget,
      url: `${this.origin}/v1/paymentWidgets.js?checkoutId=${encodeURIComponent(checkout.id)}`,
    };
  }

  async lookup(target: PaymentTarget): Promise<ProviderPayment | null> {
    if (target.providerRef !== undefined && !/^[0-9a-f]{32}$/i.test(target.providerRef)) {
      const payment = await this.api.get<OppwaPayment>(
        `/v1/checkouts/${target.providerRef}/payment`,
        {
          query: { entityId: this.entityId },
        },
      );
      return this.paymentOf([payment]);
    }
    try {
      const found = await this.api.get<{ readonly payments?: readonly OppwaPayment[] }>(
        "/v1/query",
        {
          query: { entityId: this.entityId, merchantTransactionId: target.reference },
        },
      );
      return this.paymentOf(found.payments ?? []);
    } catch (error) {
      if (ProviderRefusedError.is(error, { status: 400 })) return null;
      throw error;
    }
  }

  async capture(request: CaptureRequest): Promise<ProviderPayment> {
    const id = await this.paymentIdOf(request.payment, "capture");
    const payment = await this.operate(id, "CP", request.amount);
    return {
      providerRef: id,
      status:
        hyperpayResult(payment.result.code) === "success"
          ? PaymentStatus.Captured
          : PaymentStatus.Authorized,
      amount: request.amount,
    };
  }

  async void(target: PaymentTarget): Promise<ProviderPayment> {
    const id = await this.paymentIdOf(target, "void");
    const payment = await this.operate(id, "RV");
    const found = await this.lookup(target);
    return {
      providerRef: id,
      status:
        hyperpayResult(payment.result.code) === "success"
          ? PaymentStatus.Voided
          : (found?.status ?? PaymentStatus.Authorized),
      amount: found?.amount ?? Money.of(payment.amount, payment.currency),
    };
  }

  async refund(request: RefundRequest): Promise<TransferResult> {
    const id = await this.paymentIdOf(request.payment, "refund");
    const payment = await this.operate(id, "RF", request.amount);
    const result = hyperpayResult(payment.result.code);
    return {
      providerRef: payment.id,
      status:
        result === "success"
          ? TransferStatus.Succeeded
          : result === "pending"
            ? TransferStatus.Pending
            : TransferStatus.Failed,
    };
  }

  async charge(request: TokenCharge): Promise<ProviderPayment> {
    const payment = await this.api.post<OppwaPayment>(
      `/v1/registrations/${request.method.token}/payments`,
      {
        entityId: this.entityId,
        amount: request.amount.toDecimal(),
        currency: request.amount.currency,
        paymentType: "DB",
        merchantTransactionId: request.reference,
        "standingInstruction.mode": "REPEATED",
        "standingInstruction.type": "UNSCHEDULED",
        "standingInstruction.source":
          request.initiator === ChargeInitiator.Merchant ? "MIT" : "CIT",
      },
    );
    return (
      this.paymentOf([payment]) ?? {
        providerRef: payment.id,
        status: PaymentStatus.Failed,
        amount: request.amount,
      }
    );
  }

  /** Runs a back-office operation (`CP`, `RV`, `RF`) on payment `id`. */
  private operate(id: string, paymentType: string, amount?: Money): Promise<OppwaPayment> {
    return this.api.post<OppwaPayment>(`/v1/payments/${id}`, {
      entityId: this.entityId,
      paymentType,
      ...(amount === undefined ? {} : { amount: amount.toDecimal(), currency: amount.currency }),
    });
  }

  /**
   * The OPPWA payment id behind `target` (32 hex characters), not the checkout id.
   *
   * @throws InvalidPaymentTransitionError when nobody has paid yet.
   */
  private async paymentIdOf(target: PaymentTarget, operation: string): Promise<string> {
    if (target.providerRef !== undefined && /^[0-9a-f]{32}$/i.test(target.providerRef))
      return target.providerRef;
    const found = await this.lookup(target);
    if (
      found === null ||
      found.status === PaymentStatus.Pending ||
      found.status === PaymentStatus.Failed
    )
      throw InvalidPaymentTransitionError.create({
        reference: target.reference,
        status: found?.status ?? PaymentStatus.Failed,
        operation,
      });
    return found.providerRef;
  }

  /** The state of the payment whose transactions are `payments`, or null when there is no initial one. */
  private paymentOf(payments: readonly OppwaPayment[]): ProviderPayment | null {
    const base = payments.find((p) => p.paymentType === "DB" || p.paymentType === "PA");
    if (base === undefined) return null;
    const amount = Money.of(base.amount, base.currency);
    const done = payments.filter((p) => p !== base && hyperpayResult(p.result.code) === "success");
    const sum = (type: string) =>
      done
        .filter((p) => p.paymentType === type)
        .reduce(
          (total, p) => total.plus(Money.of(p.amount, p.currency)),
          Money.zero(base.currency),
        );
    const result = hyperpayResult(base.result.code);
    const captured = base.paymentType === "DB" ? amount : sum("CP");
    const refunded = sum("RF");
    let status: PaymentStatus;
    if (result === "pending") status = PaymentStatus.Pending;
    else if (result === "failed") status = PaymentStatus.Failed;
    else if (done.some((p) => p.paymentType === "RV")) status = PaymentStatus.Voided;
    else if (refunded.minor > 0)
      status =
        refunded.minor >= captured.minor ? PaymentStatus.Refunded : PaymentStatus.PartiallyRefunded;
    else status = captured.minor > 0 ? PaymentStatus.Captured : PaymentStatus.Authorized;
    return {
      providerRef: base.id,
      status,
      amount,
      ...(base.registrationId === undefined
        ? {}
        : {
            method: {
              provider: this.provider,
              connectionId: this.id,
              token: base.registrationId,
              merchantInitiated: true,
            },
          }),
    };
  }
}
