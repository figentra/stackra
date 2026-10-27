/**
 * Stackra file contract:
 * Purpose: `EdiMailboxPage`, one page of the interchanges a mailbox holds for us, with the cursor of the next page.
 * Boundary: a type only. Each file is the raw interchange text and the mailbox's id for it.
 * Runtime: isomorphic
 * Governing contract: ADR 0218 (decision 3: syncs); ADR 0447 (decision 4).
 */

/** A page of received interchanges. */
export interface EdiMailboxPage {
  /** The files, oldest first. */
  readonly files: readonly { readonly id: string; readonly interchange: string }[];

  /** The cursor of the next page; undefined on the last. */
  readonly next?: string;
}
