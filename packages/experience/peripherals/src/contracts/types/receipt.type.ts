/**
 * Stackra file contract:
 * Purpose: `Receipt`, what a receipt printer prints: the order it belongs to and its lines, already laid out and
 *          translated by the caller (`"Total 12.00"`).
 * Boundary: a type only. The lines are text, never printer commands: a driver prints them as text and drops control
 *           characters, so a caller cannot reach the drawer or the cutter through a line. From the renderer it is the
 *           input of `PrintReceiptBridge`, which re-checks it.
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (decision 4: the POS kit's receipt printer); ADR 0251 (bridge input).
 */

/** A receipt to print. */
export interface Receipt {
  /** The order the receipt is for; the printed result names it back. */
  readonly orderId: string;

  /** The lines, top to bottom, as they should read on paper. */
  readonly lines: readonly string[];
}
