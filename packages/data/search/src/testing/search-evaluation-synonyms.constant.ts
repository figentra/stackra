/**
 * Stackra file contract:
 * Purpose: `SEARCH_EVALUATION_SYNONYMS`, the synonym sets the evaluation queries rely on, one per line.
 * Boundary: data only, in the `./testing` entry. The sets are in the `search.synonyms` line form (`products en: sofa, couch`), so a
 *           driver harness can pass them through `searchSynonymsOf`.
 * Runtime: isomorphic
 * Governing contract: ADR 0492 (decision 5 and enforcement: a fixed evaluation set of Arabic, English and mixed queries).
 */

/** The synonym sets the queries rely on, one per line. */
export const SEARCH_EVALUATION_SYNONYMS = [
  "products en: sofa, couch",
  "products ar: كنبة, أريكة",
].join("\n");
