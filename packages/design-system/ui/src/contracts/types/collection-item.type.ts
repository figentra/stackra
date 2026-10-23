/**
 * Stackra file contract:
 * Purpose: the least a row, list entry or tab must carry for a collection to select and key it: a string `id`. A
 *          component's own item type extends it with the text and data it draws.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0313.
 */

/** The base of every item of a collection on web and native. */
export interface CollectionItem {
  /** The key the selection holds and React keys the row by; unique within the collection. */
  readonly id: string;
}
