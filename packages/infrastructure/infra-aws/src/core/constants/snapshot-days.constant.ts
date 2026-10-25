/**
 * Stackra file contract:
 * Purpose: `SNAPSHOT_DAYS`, how long a snapshot copy lives in the backup account when the runway names no
 *          `shared.database.backups.retentionDays`, and how long the backup account keeps replaced object versions.
 * Boundary: internal; a default, which the runway's `retentionDays` overrides for database snapshots.
 * Runtime: isomorphic
 * Governing contract: ADR 0186 (decision 2: 35-day snapshots in the backup account).
 */

/** Days a snapshot copy is kept. */
export const SNAPSHOT_DAYS = 35;
