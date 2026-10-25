/**
 * Stackra file contract:
 * Purpose: `TerminalRequest`, an amount to present on a card terminal, with an optional tip prompt.
 * Boundary: a type in the leaf entry; the terminal id is the provider's id of the reader.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 5); ADR 0339.
 */
import type { Money } from "@stackra/money";

import type { TipPrompt } from "#contracts/types/tip-prompt.type";

/**
 * Charge on a terminal.
 *
 * @example
 * await payments.startTerminal(market, { reference: "chk_9", terminalId: "tmr_1", amount, tipPrompt });
 */
export interface TerminalRequest {
  /** The merchant's id of the payment; one payment per reference. */
  readonly reference: string;

  /** The provider's id of the terminal. */
  readonly terminalId: string;

  /** The amount before any tip. */
  readonly amount: Money;

  /** Ask for a tip first (`PaymentCapability.TerminalTips`). */
  readonly tipPrompt?: TipPrompt;

  /** Authorise only; a capture follows. */
  readonly captureLater?: boolean;
}
