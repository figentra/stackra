/**
 * Stackra file contract:
 * Purpose: `TerminalRequest`, an amount to present on a card terminal, with an optional tip prompt, the tender kind
 *          (a restricted program such as EBT SNAP) and whether the terminal asks for a PIN.
 * Boundary: a type in the leaf entry; the terminal id is the provider's id of the reader. The PIN is entered on the
 *           terminal and never reaches the platform; `pinEntry` only asks for the step.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 5); ADR 0339; ADR 0377; ADR 0445; R3-SO-08.
 */
import type { Money } from "@stackra/money";

import type { TenderKind } from "#contracts/enums/tender-kind.enum";
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

  /** What the customer tenders; `card` when absent (`PaymentCapability.RestrictedTender` for `restricted`). */
  readonly tender?: TenderKind;

  /** The restricted program code (`snap`, `meal_voucher`), with `tender: restricted`. */
  readonly program?: string;

  /** Ask for a PIN on the terminal (`PaymentCapability.TerminalPin`). */
  readonly pinEntry?: boolean;
}
