/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/search (the `Search` reader and the index value it gives, the
 *          memory search driver, the memory vector index driver, the configuration and its shipped schema, the
 *          settings group (synonym sets), the cursor refusal, and the word helpers `searchWordsOf` (the one
 *          normalisation) and `arabiziOf` (an Arabizi word's Arabic spelling) until `stackra gen` writes the entry
 *          barrels (STA-339).
 *          `SearchHealthIndicatorDriver` is the `/readyz` probe.
 * Boundary: names each re-export and declares nothing. The shipped schema is re-exported under its generated name
 *           (`SearchConfig$`). The word helpers are public so a caller that stores or compares search text (an OS
 *           service's own lookup column) folds it the way the index does, never with a copy (STA-1251). The document
 *           builder and the driver-name list stay internal. The
 *           ports are `./contracts`'; the Postgres and pgvector drivers and the migration macro are `./node`'s.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note; STA-1251.
 */
export { SearchConfig } from "#config/search.config";
export { SEARCH_CONFIG_SCHEMA as SearchConfig$ } from "#core/constants/search-config-schema.constant";
export { MemorySearchDriver } from "#core/drivers/memory-search.driver";
export { MemoryVectorIndexDriver } from "#core/drivers/memory-vector-index.driver";
export { SearchHealthIndicatorDriver } from "#core/drivers/search-health-indicator.driver";
export { SearchIndexState } from "#core/enums/search-index-state.enum";
export { SearchCursorInvalidError } from "#core/errors/search-cursor-invalid.error";
export { arabiziOf } from "#core/functions/arabizi-of.function";
export { searchWordsOf } from "#core/functions/search-words-of.function";
export { SearchOptions } from "#core/schemas/search-options.schema";
export { SearchSettings } from "#core/search.settings";
export { Search } from "#core/services/search.service";
export type { SearchAcrossOptions } from "#core/types/search-across-options.type";
export type { SearchFacetOptions } from "#core/types/search-facet-options.type";
export type { SearchFindOptions } from "#core/types/search-find-options.type";
export type { SearchHit } from "#core/types/search-hit.type";
export type { SearchIndexStatus } from "#core/types/search-index-status.type";
export type { SearchPageOptions } from "#core/types/search-page-options.type";
export type { SearchReindexOptions } from "#core/types/search-reindex-options.type";
export type { SearchSimilarOptions } from "#core/types/search-similar-options.type";
export { SearchIndex } from "#core/values/search-index.value";
