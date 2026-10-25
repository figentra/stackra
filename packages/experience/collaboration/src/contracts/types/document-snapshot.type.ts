/**
 * Stackra file contract:
 * Purpose: `DocumentSnapshot`, the saved state of a co-edited document: the full encoded state and when it was taken.
 * Boundary: a type only, in the leaf entry. The state is opaque (a Yjs state update for a Yjs replica) and complete, so
 *           applying the latest snapshot alone restores the document. Versions, drafts and publishing are the
 *           content type's (ADR 0270 decision 2), not snapshots.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 2: state saved as snapshots); ADR 0270 (decisions 2 and 5).
 */

/** One saved state. */
export interface DocumentSnapshot {
  /** The document's full encoded state. */
  readonly state: Uint8Array;

  /** When the state was taken. */
  readonly savedAt: Date;
}
