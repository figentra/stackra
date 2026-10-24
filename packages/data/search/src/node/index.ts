/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/search (the Postgres driver and the `t.searchable(...)`
 *          migration macro with its argument type) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Server only: both reach Postgres through @stackra/database. The
 *           migration is found by its path, as every migration is, so it is not re-exported.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note (an entry exists once its folder has a file);
 *                     the STA-347 stand-in barrel decision.
 */
export { SearchableMacro } from "#node/database/macros/searchable.macro";
export { PostgresSearchDriver } from "#node/drivers/postgres-search.driver";
export type { SearchableColumns } from "#node/types/searchable-columns.type";
