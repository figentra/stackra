/**
 * Stackra file contract:
 * Purpose: `AgentCheckoutRequest`, an agent's request to pay a cart the shopper confirmed in their wallet: the
 *          protocol, the protocol's proof and the amount to take under the merchant reference.
 * Boundary: a type in the leaf entry; `PaymentService#agentCheckout` verifies `proof` through `AgentCommerceProtocols`
 *           and pays only within what the shopper confirmed. The proof is opaque here.
 * Runtime: isomorphic
 * Governing contract: ADR 0446; COM-125; STA-764.
 */
import type { Money } from "@stackra/money";

/**
 * Pay an agent-built cart.
 *
 * @example
 * await payments.agentCheckout({ protocol: "acp", proof, reference: cart.id, amount });
 */
export interface AgentCheckoutRequest {
  /** The protocol code. */
  readonly protocol: string;

  /** The protocol's proof of the shopper's wallet confirmation (a mandate or a delegated payment token). */
  readonly proof: string;

  /** The merchant's id of the payment; it must be the reference the shopper confirmed. */
  readonly reference: string;

  /** The amount to take; never more than the shopper confirmed. */
  readonly amount: Money;

  /** What the shopper's statement shows. */
  readonly description?: string;
}
