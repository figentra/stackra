/**
 * Stackra file contract:
 * Purpose: `PaymentGateways`, the port that hands the engine a `PaymentGateway` for a call: for a Market and the
 *          capabilities the call needs, or for the connection that served an earlier call of the same payment.
 * Boundary: an abstract class that is its own token, key `payments.PaymentGateways`. The `connection` driver applies
 *           ADR 0356 (the tenant's own Connection first, then the Market's platform Connection); a test binds the
 *           fake from `./testing`. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decisions 2 to 4); ADR 0357 (decision 2); ADR 0294 (decision 16).
 */
import { Port } from "@stackra/contracts";

import type { PaymentCapability } from "#contracts/enums/payment-capability.enum";
import type { PaymentGateway } from "#contracts/types/payment-gateway.type";

/**
 * Which provider serves a call.
 *
 * @example
 * const gateway = await gateways.forMarket(market, [PaymentCapability.Checkout]);
 */
export abstract class PaymentGateways extends Port {
  /** Type-only port key. */
  declare readonly "~key": "payments.PaymentGateways";

  /**
   * The gateway for `market` that has every capability in `needs`.
   *
   * @throws NoPaymentProviderError when no provider of the Market has them all.
   */
  abstract forMarket(market: string, needs: readonly PaymentCapability[]): Promise<PaymentGateway>;

  /**
   * The gateway of connection `connectionId` of `provider`: the one that served the payment, so a capture, refund or
   * lookup goes to the same account.
   *
   * @throws NoPaymentProviderError when `provider` is not a payments provider of this package.
   */
  abstract byConnection(provider: string, connectionId: string): Promise<PaymentGateway>;
}
