/**
 * Stackra file contract:
 * Purpose: `ReceiptTokenClaims`, what a signed receipt token says: the receipt it belongs to, the node (store or venue)
 *          that issued it, and when it was issued.
 * Boundary: a type only. The till or the receipts service signs it; an exit gate checks it with the public key only.
 * Runtime: isomorphic
 * Governing contract: ADR 0429 (decision 2).
 */

/** The claims of a receipt token. */
export interface ReceiptTokenClaims {
  /** The receipt's public id. */
  readonly receiptId: string;
  /** The tenancy node (store, venue) the sale belongs to. */
  readonly nodeId: string;
  /** When the token was issued, in milliseconds since the epoch. */
  readonly issuedAt: number;
}
