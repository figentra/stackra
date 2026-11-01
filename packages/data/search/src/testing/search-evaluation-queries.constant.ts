/**
 * Stackra file contract:
 * Purpose: `SEARCH_EVALUATION_QUERIES`, the fixed shopper queries (English, Arabic and mixed) with graded relevance labels
 *          over `SEARCH_EVALUATION_CATALOGUE`.
 * Boundary: data only, in the `./testing` entry. Changing a label changes the thresholds' meaning: raise
 *           `SEARCH_EVALUATION_THRESHOLDS` only with the change that earns it.
 * Runtime: isomorphic
 * Governing contract: ADR 0492 (decision 5 and enforcement: a fixed evaluation set of Arabic, English and mixed queries).
 */

import type { SearchEvaluationQuery } from "#testing/search-evaluation-query.type";

/** The judged queries. */
export const SEARCH_EVALUATION_QUERIES: readonly SearchEvaluationQuery[] = [
  { query: "linen shirt", locale: "en", script: "english", grades: { p01: 2, p12: 1 } },
  { query: "linen", locale: "en", script: "english", grades: { p01: 2, p12: 2 } },
  { query: "leather", locale: "en", script: "english", grades: { p04: 2, p09: 2 } },
  { query: "sofa", locale: "en", script: "english", grades: { p04: 2, p05: 2 } },
  { query: "dining", locale: "en", script: "english", grades: { p06: 2, p07: 2 } },
  { query: "wireless", locale: "en", script: "english", grades: { p10: 2, p11: 2 } },
  { query: "قميص كتان", locale: "ar", script: "arabic", grades: { p01: 2, p12: 1 } },
  { query: "كتان", locale: "ar", script: "arabic", grades: { p01: 2, p12: 2 } },
  { query: "جلد", locale: "ar", script: "arabic", grades: { p04: 2, p09: 2 } },
  { query: "اريكة", locale: "ar", script: "arabic", grades: { p04: 2, p05: 2 } },
  { query: "طعام", locale: "ar", script: "arabic", grades: { p06: 2, p07: 2 } },
  { query: "سماعات", locale: "ar", script: "arabic", grades: { p10: 2 } },
  { query: "قهوة coffee", locale: "ar", script: "mixed", grades: { p15: 2 } },
  { query: "كنبة leather", locale: "ar", script: "mixed", grades: { p04: 2 } },
];
