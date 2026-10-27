/**
 * Stackra file contract:
 * Purpose: `PaymentGateway`, the gateway port every payment driver implements: open a hosted checkout, look a payment up,
 *          refund it; plus the driver's provider code, connection id and capabilities.
 * Boundary: an interface a provider's `Connection` class implements, not a container port: the tenant's or the
 *           platform's Connection chooses the provider per call (ADR 0356 decision 2), so the driver is the connection
 *           itself, reached through `PaymentGateways`. The optional ports (`CaptureGateway`, `TokenGateway` and the rest) are
 *           narrowed to with `hasPaymentCapability`. `mode` is the connection's `mode` field (`own-key` when absent).
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decisions 1, 2, 5 and 6); ADR 0356 (decision 2); ADR 0358 (decision 3).
 */
import type { PaymentCapability } from "#contracts/enums/payment-capability.enum";
import type { CheckoutRequest } from "#contracts/types/checkout-request.type";
import type { CheckoutSession } from "#contracts/types/checkout-session.type";
import type { PaymentConnectionMode } from "#contracts/types/payment-connection-mode.type";
import type { PaymentTarget } from "#contracts/types/payment-target.type";
import type { ProviderPayment } from "#contracts/types/provider-payment.type";
import type { RefundRequest } from "#contracts/types/refund-request.type";
import type { TransferResult } from "#contracts/types/transfer-result.type";

/**
 * One provider account, as the engine calls it.
 *
 * @example
 * const gateway = await gateways.forMarket(market, [PaymentCapability.Checkout]);
 * const session = await gateway.checkout(request);
 */
export interface PaymentGateway {
  /** The serving connection's id. */
  readonly id: string;

  /** The provider code, the Integration's `provider`. */
  readonly provider: string;

  /** How the connection reaches the money; read it with `modeOf`, which defaults it to `own-key`. */
  readonly mode?: PaymentConnectionMode;

  /** What this driver can do beyond checkout, lookup and refund. */
  readonly capabilities: readonly PaymentCapability[];

  /**
   * Opens a hosted page or widget for the amount and tip of `request`.
   *
   * @throws PaymentFieldRequiredError when the provider needs a field the request left out.
   * @throws PaymentDeclinedError when the provider refuses the customer up front (buy-now-pay-later scoring).
   */
  checkout(request: CheckoutRequest): Promise<CheckoutSession>;

  /**
   * The payment as the provider holds it now: by `providerRef` when given, else by `reference` where the provider
   * can search by it.
   *
   * @returns null when the provider holds no payment for the target.
   */
  lookup(target: PaymentTarget): Promise<ProviderPayment | null>;

  /** Refunds all or part of a captured payment. */
  refund(request: RefundRequest): Promise<TransferResult>;
}
