/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/search (the Postgres search driver, the pgvector
 *          `VectorIndex` driver, the `t.searchable(...)` migration macro with its argument type, and automatic indexing
 *          from the outbox: `registerSearchableModels` and its change consumers `SearchableChangeService` and, for a
 *          `semantic: true` model, `SemanticChangeService`, and for a model a dotted facet path walks to,
 *          `RelatedChangeService`), the index registry `SearchIndexRegistry` with the reindex work `reindexSearch` and
 *          `reindexSemantic` (the jobs that run them live in @stackra/data-maintenance, ADR 0462 decision 1), the
 *          `search:status` runner (`searchStatus`) the CLI loads, `SearchForgetService`, which an erasure uses to drop
 *          rows from every index (stackra-275), and `SearchQuery`, the base of the search query gen writes per
 *          `@Searchable` model, with its input, output and hit shapes (stackra-305), until `stackra gen` writes the
 *          entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Server only: all of it reaches Postgres through
 *           @stackra/database. Migrations are found by their path, as every migration is, so none is re-exported; the
 *           registry of watched models stays internal.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); STA-1326; ADR 0127 2026-10-24 note (an entry exists once its folder has a
 *                     file); the STA-347 stand-in barrel decision.
 */
export { SearchQuery } from "#node/bases/search-query.base";
export { SearchableMacro } from "#node/database/macros/searchable.macro";
export { HttpEmbedderDriver } from "#node/drivers/http-embedder.driver";
export { PgvectorVectorIndexDriver } from "#node/drivers/pgvector-vector-index.driver";
export { PostgresSearchQueryLogDriver } from "#node/drivers/postgres-search-query-log.driver";
export { PostgresSearchDriver } from "#node/drivers/postgres-search.driver";
export { registerSearchableModels } from "#node/functions/register-searchable-models.function";
export { reindexSearch } from "#node/functions/reindex-search.function";
export { reindexSemantic } from "#node/functions/reindex-semantic.function";
export { searchFacetHashOf } from "#node/functions/search-facet-hash-of.function";
export { searchStatus } from "#node/functions/search-status.function";
export { SearchQueryInput } from "#node/schemas/search-query-input.schema";
export { SearchQueryOutput } from "#node/schemas/search-query-output.schema";
export { RelatedChangeService } from "#node/services/related-change.service";
export { SearchForgetService } from "#node/services/search-forget.service";
export { SearchIndexRegistry } from "#node/services/search-index-registry.service";
export { SearchableChangeService } from "#node/services/searchable-change.service";
export { SemanticChangeService } from "#node/services/semantic-change.service";
export type { SearchQueryReportOptions } from "#node/types/search-query-report-options.type";
export type { SearchQueryReportRow } from "#node/types/search-query-report-row.type";
export type { SearchableColumns } from "#node/types/searchable-columns.type";
export type { SearchQueryClass } from "#node/types/search-query-class.type";
export type { SearchQueryHit } from "#node/types/search-query-hit.type";
export type { SearchQueryOptions } from "#node/types/search-query-options.type";
