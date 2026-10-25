/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/database until `stackra gen` writes the entry barrels
 *          (STA-339): `PostgresDatabaseDriver`, which gen's boot calls to connect, and `DatabaseUnitOfWorkDriver`, the
 *          action pipeline's unit of work on it. The sequence tables' migration under `database/migrations/` is found
 *          by its path and not exported.
 * Boundary: names each re-export and declares nothing. Server only: the entry that starts MikroORM, so it stays out of
 *           the `.` entry that the models and services import.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note; the STA-347 stand-in barrel decision.
 */
export { DatabaseUnitOfWorkDriver } from "#node/drivers/database-unit-of-work.driver";
export { PostgresDatabaseDriver } from "#node/drivers/postgres-database.driver";
