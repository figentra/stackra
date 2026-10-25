/**
 * Stackra file contract:
 * Purpose: `PostedJournal`, a journal as the accounting provider holds it: its id there and whether it is posted or a
 *          draft awaiting approval in the provider.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: Juristra services-and-packages; ADR 0356 (decision 2).
 */

/** A journal at the provider. */
export interface PostedJournal {
  /** The provider's id of the journal. */
  readonly providerRef: string;

  /** `posted` when it is in the ledger, `draft` when the provider holds it for approval. */
  readonly status: "posted" | "draft";
}
