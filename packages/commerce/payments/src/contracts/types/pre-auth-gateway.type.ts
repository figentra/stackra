/**
 * Stackra file contract:
 * Purpose: `PreAuthGateway`, the port of a driver that holds an amount on a saved token without taking it (a
 *          pre-authorised tab, a deposit); the hold is then captured or released through `CaptureGateway`.
 * Boundary: an interface a provider's `Connection` class implements, not a container port: the tenant's or the
 *           platform's Connection chooses the provider per call (ADR 0356 decision 2), so the driver is the connection
 *           itself, reached through `PaymentGateways`. The service checks the merchant-initiated flag before it calls.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decisions 2 and 5); STA-1024.
 */
import type { ProviderPayment } from "#contracts/types/provider-payment.type";
import type { TokenCharge } from "#contracts/types/token-charge.type";

/**
 * Pre-authorisation on a saved token (`PaymentCapability.PreAuth`).
 *
 * @example
 * const held = await gateway.authorize({ reference: "tab_7", method, amount, initiator: ChargeInitiator.Customer });
 * // held.status === PaymentStatus.Authorized
 */
export interface PreAuthGateway {
  /** Holds `request.amount` on `request.method`; the answer is `authorized` when the issuer approves. */
  authorize: (request: TokenCharge) => Promise<ProviderPayment>;
}
