/**
 * Stackra file contract:
 * Purpose: `EcrTiming`, how long a semi-integrated terminal's link waits for an acknowledgement and an answer, and how
 *          often it resends an unacknowledged frame.
 * Boundary: a type in the leaf entry; the values are the provider's `EcrProfile.timing` (pack data), never constants.
 * Runtime: isomorphic
 * Governing contract: ADR 0377 (decisions 1, 2 and 9).
 */

/** How long the link waits, and how often it resends; the provider's `EcrProfile.timing` (pack data). */
export interface EcrTiming {
  /** How long the terminal has to answer an exchange, in milliseconds (the customer is at the terminal meanwhile). */
  readonly answerMs: number;

  /** How long the terminal has to acknowledge a sent message, in milliseconds. */
  readonly ackMs: number;

  /** How many times an unacknowledged or refused (NAK) message is resent before the call rejects. */
  readonly retries: number;
}
