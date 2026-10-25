/**
 * Stackra file contract:
 * Purpose: `PITR_DAYS`, how far back the environment's Postgres can be restored to any point: fourteen days.
 * Boundary: internal; `awsBaselineConfig` sets it when the environment's `shared.database.backups.pitr` is on. The
 *           window is the ADR's, not a runway value.
 * Runtime: isomorphic
 * Governing contract: ADR 0186 (decision 1: point-in-time recovery, fourteen days).
 */

/** Days of point-in-time recovery. */
export const PITR_DAYS = 14;
