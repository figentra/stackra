/**
 * Stackra file contract:
 * Purpose: `BACKUP_DAYS_CEILING`, the days a backup may outlive an erasure unless its data is crypto-shredded: the
 *          ceiling of an environment's `retentionDays` and of the backup vault lock's `maxRetentionDays`.
 * Boundary: internal; read by the runway schema and `backupLockFrom`. Never raised in code.
 * Runtime: isomorphic
 * Governing contract: ADR 0188 (decision 3: backups kept 35 days or less, or crypto-shredded).
 */

/** Days a backup may be kept without crypto-shredding. */
export const BACKUP_DAYS_CEILING = 35;
