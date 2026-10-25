/**
 * Stackra file contract:
 * Purpose: `TerminalPairing`, what pairing a card terminal to a till needs: the terminal's id as its provider knows
 *          it, the provider (a market-pack payments key) and where the till reaches it.
 * Boundary: a type only; never a secret: the provider's credentials stay with the payments driver.
 * Runtime: isomorphic
 * Governing contract: ADR 0339 (decision 1 and open question 1).
 */

/** A terminal to pair. */
export interface TerminalPairing {
  /** The terminal's id at its provider (a serial or a terminal id). */
  readonly terminalId: string;

  /** The provider key, as the market pack names it. */
  readonly provider: string;

  /** The terminal's LAN address where the provider uses one; null when the provider routes through its cloud. */
  readonly address: string | null;
}
