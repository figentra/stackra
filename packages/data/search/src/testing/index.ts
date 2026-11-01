/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/search (the `SearchDriver` conformance suite: its runner,
 *          cases, seed documents and result types; the `Reranker` conformance suite; and the evaluation set: catalogue,
 *          judged queries, thresholds and the `ndcgAt` and `recallAt` metrics) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Test support only; never imported by production code. It
 *           imports `./contracts` only, so a driver package (Pro included) needs nothing else of this package to run it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0089 (decision 5); the STA-347 stand-in barrel decision.
 */
export { ndcgAt } from "#testing/ndcg-at.function";
export { recallAt } from "#testing/recall-at.function";
export { runRerankerConformance } from "#testing/run-reranker-conformance.function";
export { runSearchConformance } from "#testing/run-search-conformance.function";
export { SEARCH_CONFORMANCE_CASES } from "#testing/search-conformance-cases.constant";
export type { SearchEvaluationProduct } from "#testing/search-evaluation-product.type";
export type { SearchEvaluationQuery } from "#testing/search-evaluation-query.type";
export type { SearchConformanceCase } from "#testing/search-conformance-case.type";
export { SEARCH_CONFORMANCE_DOCUMENTS } from "#testing/search-conformance-documents.constant";
export { SEARCH_EVALUATION_CATALOGUE } from "#testing/search-evaluation-catalogue.constant";
export { SEARCH_EVALUATION_QUERIES } from "#testing/search-evaluation-queries.constant";
export { SEARCH_EVALUATION_SYNONYMS } from "#testing/search-evaluation-synonyms.constant";
export { SEARCH_EVALUATION_THRESHOLDS } from "#testing/search-evaluation-thresholds.constant";
export { searchConformanceTable } from "#testing/search-conformance-table.function";
export type { SearchConformanceOptions } from "#testing/search-conformance-options.type";
export type { SearchConformanceResult } from "#testing/search-conformance-result.type";
