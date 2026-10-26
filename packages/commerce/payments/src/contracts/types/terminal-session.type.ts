/**
 * Stackra file contract:
 * Purpose: `TerminalSession`, an amount presented on a terminal and where it stands.
 * Boundary: a type in the leaf entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decisions 5 and 6).
 */
import type { Money } from "@stackra/money";

import type { PaymentStatus } from "#contracts/enums/payment-status.enum";

/**
 * A terminal payment in progress.
 *
 * @example
 * const session = await payments.startTerminal(market, request);
 */
export interface TerminalSession {
  /** The provider's id of the payment. */
  readonly providerRef: string;

  /** The terminal it runs on. */
  readonly terminalId: string;

  /** The state of the session's payment. */
  readonly status: PaymentStatus;

  /** The tip the customer chose, once known. */
  readonly tip?: Money;
}
