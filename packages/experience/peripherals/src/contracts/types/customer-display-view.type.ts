/**
 * Stackra file contract:
 * Purpose: `CustomerDisplayView`, what the customer-facing display shows: the basket lines, the total and a message
 *          (a greeting, "please tap your card"), all formatted by the till in the customer's language.
 * Boundary: a type only; plain text, so it crosses a window or a device boundary as JSON. What a display shows per
 *           industry is a settings default, not code.
 * Runtime: isomorphic
 * Governing contract: ADR 0339 (decision 1 and open question 3); the COM-235 and RES-183 answers.
 */
import type { CustomerDisplayLine } from "#contracts/types/customer-display-line.type";

/** One screen of the customer display. */
export interface CustomerDisplayView {
  /** The basket lines, in order. */
  readonly lines: readonly CustomerDisplayLine[];

  /** The total, formatted; null hides it. */
  readonly total: string | null;

  /** A message under the basket; null for none. */
  readonly message: string | null;
}
