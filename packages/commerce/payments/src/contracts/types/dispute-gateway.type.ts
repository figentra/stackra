/**
 * Stackra file contract:
 * Purpose: `DisputeGateway`, the port of a driver that reads chargebacks and answers them with evidence or accepts them.
 * Boundary: an interface a provider's `Connection` class implements, not a container port: the tenant's or the
 *           platform's Connection chooses the provider per call (ADR 0356 decision 2), so the driver is the connection
 *           itself, reached through `PaymentGateways`.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (Enforcement: the dispute port).
 */
import type { Dispute } from "#contracts/types/dispute.type";
import type { DisputeEvidence } from "#contracts/types/dispute-evidence.type";

/**
 * Reads and answers disputes (`PaymentCapability.Disputes`).
 *
 * @example
 * await gateway.respond(dispute.providerRef, { text });
 */
export interface DisputeGateway {
  /** The dispute as the provider holds it now. */
  dispute(providerRef: string): Promise<Dispute>;

  /** Submits evidence; the dispute moves to review. */
  respond(providerRef: string, evidence: DisputeEvidence): Promise<Dispute>;

  /** Accepts the chargeback without contest. */
  accept(providerRef: string): Promise<Dispute>;
}
