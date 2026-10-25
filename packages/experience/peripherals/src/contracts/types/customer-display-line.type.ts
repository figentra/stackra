/**
 * Stackra file contract:
 * Purpose: `CustomerDisplayLine`, one line the customer sees on the till's customer-facing display: a label and its
 *          amount, both already translated and formatted by the till.
 * Boundary: a type only; text, never markup.
 * Runtime: isomorphic
 * Governing contract: ADR 0339 (decision 1: `CustomerDisplay`).
 */

/** A displayed line. */
export interface CustomerDisplayLine {
  /** What the line is (`Latte, large`). */
  readonly label: string;

  /** Its amount, formatted (`SAR 18.00`). */
  readonly amount: string;
}
