/**
 * Stackra file contract:
 * Purpose: `BACKFILL_LEDGER`, the quoted table `database.backfill_runs` (migration `database.0009_create_backfill_runs`)
 *          where `runBackfill` keeps each backfill's cursor, counts and last failure.
 * Boundary: a literal; the table is the database package's own, a platform table (no row belongs to a tenant).
 * Runtime: node
 * Governing contract: ADR 0159 (decision 3: backfills run as queue jobs, resumable).
 */

/** The backfill ledger. */
export const BACKFILL_LEDGER = '"database"."backfill_runs"';
