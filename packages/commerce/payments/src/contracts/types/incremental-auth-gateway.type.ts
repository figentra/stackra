/**
 * Stackra file contract:
 * Purpose: `IncrementalAuthGateway`, the port of a driver that raises the amount an authorised payment holds (a tab
 *          that grows past its first hold).
 * Boundary: an interface a provider's `Connection` class implements, not a container port: the tenant's or the
 *           platform's Connection chooses the provider per call (ADR 0356 decision 2), so the driver is the connection
 *           itself, reached through `PaymentGateways`. The answer carries the whole amount now held.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 2); STA-1024.
 */
import type { IncrementRequest } from "#contracts/types/increment-request.type";
import type { ProviderPayment } from "#contracts/types/provider-payment.type";

/**
 * Incremental authorisation (`PaymentCapability.IncrementalAuth`).
 *
 * @example
 * if (hasPaymentCapability(gateway, PaymentCapability.IncrementalAuth)) await gateway.increment(request);
 */
export interface IncrementalAuthGateway {
  /** Adds `request.amount` to the hold; the answer's `amount` is the whole hold, tip included. */
  increment(request: IncrementRequest): Promise<ProviderPayment>;
}
