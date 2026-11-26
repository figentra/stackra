/**
 * Stackra file contract:
 * Purpose: `PRELOADED_EXTENSIONS`, the approved Postgres extensions the server must load at start
 *          (`shared_preload_libraries`) before `create extension` works: pg_stat_statements alone of the eight.
 * Boundary: data only; `runtimePlan` puts the ones a server's consumers name into its `preloadLibraries`.
 * Runtime: isomorphic
 * Governing contract: ADR 0160 (notes of 2026-10-29 and 2026-11-03: infra preloads what needs it).
 */
import { PostgresExtension } from "@stackra/runway";

/** The extensions that need a preload. */
export const PRELOADED_EXTENSIONS: ReadonlySet<PostgresExtension> = new Set([
  PostgresExtension.PgStatStatements,
]);
