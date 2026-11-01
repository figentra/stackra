/**
 * Stackra file contract:
 * Purpose: `SynonymSet`, one equivalence set of a tenant's synonyms: the index and language it applies to and its
 *          terms.
 * Boundary: a type only. Terms are as the tenant typed them; `SearchIndex` normalises them with `searchWordsOf` before
 *           they reach a driver. Index and language read as in the `search.synonyms` setting line (`products en: ...`).
 * Runtime: isomorphic
 * Governing contract: ADR 0492 (decision 5: per-tenant synonyms); ADR 0403.
 */

/** One synonym set. */
export interface SynonymSet {
  /** The index (the model's table, bare or schema-qualified) the set applies to. */
  readonly index: string;

  /** The language subtag (`ar`, `en`) the set applies to. */
  readonly language: string;

  /** The terms that find each other, two or more. */
  readonly terms: readonly string[];
}
