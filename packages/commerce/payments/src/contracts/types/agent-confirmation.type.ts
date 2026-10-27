/**
 * Stackra file contract:
 * Purpose: `AgentConfirmation`, what an agent commerce protocol proves about an agent's payment: the shopper confirmed
 *          it in their own wallet, for one merchant reference, up to an amount, until a time, and the wallet token the
 *          provider charges.
 * Boundary: a type in the leaf entry, returned by the `AgentCommerceProtocols` port after the protocol's own proof
 *           (a signed mandate, a delegated payment token) is verified. Only a provider token, never a card number
 *           (PCI SAQ-A). An agent never pays alone: without a confirmation there is no payment.
 * Runtime: isomorphic
 * Governing contract: ADR 0446; ADR 0357 (decision 5); COM-125; STA-764.
 */
import type { Money } from "@stackra/money";

import type { SavedMethod } from "#contracts/types/saved-method.type";

/**
 * A shopper's wallet confirmation of an agent's payment.
 *
 * @example
 * const confirmation = await agents.confirmation("acp", token);
 */
export interface AgentConfirmation {
  /** The protocol code the confirmation came through (a connector catalogue row per pack). */
  readonly protocol: string;

  /** The protocol's id of the agent that asked. */
  readonly agent: string;

  /** The merchant reference (the cart or order id) the shopper confirmed. */
  readonly reference: string;

  /** The most the shopper confirmed, in the cart's currency. */
  readonly amount: Money;

  /** When the shopper confirmed in the wallet. */
  readonly confirmedAt: Date;

  /** After this instant the confirmation pays nothing. */
  readonly expiresAt: Date;

  /** The wallet's token at the provider, bound to the connection that charges it. */
  readonly method: SavedMethod;
}
