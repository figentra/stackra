/**
 * Stackra file contract:
 * Purpose: `PayoutGateway`, the port of a driver that sends money from the platform's balance to a merchant's account.
 * Boundary: an interface a provider's `Connection` class implements, not a container port: the tenant's or the
 *           platform's Connection chooses the provider per call (ADR 0356 decision 2), so the driver is the connection
 *           itself, reached through `PaymentGateways`.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 2: the platform-payments layer).
 */
import type { PayoutRequest } from "#contracts/types/payout-request.type";
import type { TransferResult } from "#contracts/types/transfer-result.type";

/**
 * Sends payouts (`PaymentCapability.Payouts`).
 *
 * @example
 * await gateway.payout({ reference: "po_1", amount, destination });
 */
export interface PayoutGateway {
  /** Sends `request.amount` to `request.destination`. */
  payout: (request: PayoutRequest) => Promise<TransferResult>;
}
