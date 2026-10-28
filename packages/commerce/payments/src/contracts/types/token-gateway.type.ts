/**
 * Stackra file contract:
 * Purpose: `TokenGateway`, the port of a driver that charges saved tokens, customer- or merchant-initiated.
 * Boundary: an interface a provider's `Connection` class implements, not a container port: the tenant's or the
 *           platform's Connection chooses the provider per call (ADR 0356 decision 2), so the driver is the connection
 *           itself, reached through `PaymentGateways`. The service checks the merchant-initiated flag before it calls.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 5).
 */
import type { ProviderPayment } from "#contracts/types/provider-payment.type";
import type { TokenCharge } from "#contracts/types/token-charge.type";

/**
 * Saved-token charges (`PaymentCapability.Tokens`).
 *
 * @example
 * await gateway.charge({ reference, method, amount, initiator: ChargeInitiator.Customer });
 */
export interface TokenGateway {
  /** Charges `request.method` for `request.amount`, flagged as merchant-initiated when the initiator is the merchant. */
  charge: (request: TokenCharge) => Promise<ProviderPayment>;
}
