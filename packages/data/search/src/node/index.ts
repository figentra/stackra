/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/search (the Postgres search driver, the pgvector
 *          `VectorIndex` driver, the `t.searchable(...)` migration macro with its argument type, and automatic indexing
 *          from the outbox: `registerSearchableModels` and its change consumers `SearchableChangeService` and, for a
 *          `semantic: true` model, `SemanticChangeService`, and for a model a dotted facet path walks to,
 *          `RelatedChangeService`), the index registry `SearchIndexRegistry` with the reindex
 *          jobs `ReindexSearchAction` and `ReindexSemanticAction`, and the `search:reindex`/`search:status` runner
 *          (`searchReindex`, `searchStatus`) the CLI loads, until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Server only: all of it reaches Postgres through
 *           @stackra/database. Migrations are found by their path, as every migration is, so none is re-exported;
 *           the registry of watched models stays internal.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); STA-1326; ADR 0127 2026-10-24 note (an entry exists once its folder has a file);
 *                     the STA-347 stand-in barrel decision.
 */
export { ReindexSearchAction } from "#node/actions/reindex-search.action";
export { ReindexSemanticAction } from "#node/actions/reindex-semantic.action";
export { SearchableMacro } from "#node/database/macros/searchable.macro";
export { HttpEmbedderDriver } from "#node/drivers/http-embedder.driver";
export { PgvectorVectorIndexDriver } from "#node/drivers/pgvector-vector-index.driver";
export { PostgresSearchDriver } from "#node/drivers/postgres-search.driver";
export { registerSearchableModels } from "#node/functions/register-searchable-models.function";
export { searchFacetHashOf } from "#node/functions/search-facet-hash-of.function";
export { searchReindex } from "#node/functions/search-reindex.function";
export { searchStatus } from "#node/functions/search-status.function";
export { ReindexSearchInput } from "#node/schemas/reindex-search-input.schema";
export { ReindexSearchOutput } from "#node/schemas/reindex-search-output.schema";
export { RelatedChangeService } from "#node/services/related-change.service";
export { SearchIndexRegistry } from "#node/services/search-index-registry.service";
export { SearchableChangeService } from "#node/services/searchable-change.service";
export { SemanticChangeService } from "#node/services/semantic-change.service";
export type { SearchableColumns } from "#node/types/searchable-columns.type";
