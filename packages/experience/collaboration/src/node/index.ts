/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/collaboration (the Postgres snapshot store) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Server only: the driver reaches Postgres through
 *           @stackra/database. The snapshot migration is found by its path, as every migration is, so it is not
 *           re-exported.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note (an entry exists once its folder has a file);
 *                     the STA-347 stand-in barrel decision.
 */
export { PostgresSnapshotStoreDriver } from "#node/drivers/postgres-snapshot-store.driver";
