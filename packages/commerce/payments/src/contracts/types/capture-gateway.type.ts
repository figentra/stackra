/**
 * Stackra file contract:
 * Purpose: `CaptureGateway`, the port of a driver that can authorise first and capture or void later.
 * Boundary: an interface a provider's `Connection` class implements, not a container port: the tenant's or the
 *           platform's Connection chooses the provider per call (ADR 0356 decision 2), so the driver is the connection
 *           itself, reached through `PaymentGateways`.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 2).
 */
import type { CaptureRequest } from "#contracts/types/capture-request.type";
import type { PaymentTarget } from "#contracts/types/payment-target.type";
import type { ProviderPayment } from "#contracts/types/provider-payment.type";

/**
 * Capture and void (`PaymentCapability.Capture`).
 *
 * @example
 * if (hasPaymentCapability(gateway, PaymentCapability.Capture)) await gateway.capture(request);
 */
export interface CaptureGateway {
  /** Takes all or part of an authorised payment. */
  capture: (request: CaptureRequest) => Promise<ProviderPayment>;

  /** Releases an authorised payment, or closes a session nobody paid. */
  void: (target: PaymentTarget) => Promise<ProviderPayment>;
}
