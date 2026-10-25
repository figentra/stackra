/**
 * Stackra file contract:
 * Purpose: `JOURNAL_FIELDS`, the journal's own field names, which an entry model keeps unless its `@Journaled` facet
 *          maps them elsewhere.
 * Boundary: internal; read by `Journal` only. Not exported from the entry.
 * Runtime: node
 * Governing contract: ADR 0220 (decision 4).
 */

/** The default field of each journal name. */
export const JOURNAL_FIELDS = Object.freeze({
  account: "account",
  amount: "amount",
  kind: "kind",
  reference: "reference",
  at: "at",
});
