/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/search (the `Search` reader and the index value it gives, the
 *          memory driver, the configuration and its shipped schema, and the cursor refusal) until `stackra gen` writes
 *          the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The shipped schema is re-exported under its generated name
 *           (`SearchConfig$`). The normalisation, the document builder and the driver-name list stay internal. The
 *           port is `./contracts`'; the Postgres driver and the migration macro are `./node`'s.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { SearchConfig } from "#config/search.config";
export { SEARCH_CONFIG_SCHEMA as SearchConfig$ } from "#core/constants/search-config-schema.constant";
export { MemorySearchDriver } from "#core/drivers/memory-search.driver";
export { SearchCursorInvalidError } from "#core/errors/search-cursor-invalid.error";
export { SearchOptions } from "#core/schemas/search-options.schema";
export { Search } from "#core/services/search.service";
export type { SearchFindOptions } from "#core/types/search-find-options.type";
export type { SearchPageOptions } from "#core/types/search-page-options.type";
export { SearchIndex } from "#core/values/search-index.value";
