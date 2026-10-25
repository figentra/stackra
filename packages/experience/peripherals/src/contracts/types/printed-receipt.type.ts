/**
 * Stackra file contract:
 * Purpose: `PrintedReceipt`, what a successful print answers: which printer took the job and for which order.
 * Boundary: a type only. `printer` names the printer as its driver knows it (`memory`, an ESC/POS address on the
 *           user's own network or machine); it is shown to the user, never sent to a server by this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (decision 4); ADR 0251 (bridge output).
 */

/** A receipt the printer accepted. */
export interface PrintedReceipt {
  /** The printer that took the job. */
  readonly printer: string;

  /** The order of the receipt, as given. */
  readonly orderId: string;
}
