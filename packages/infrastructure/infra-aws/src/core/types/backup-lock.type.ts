/**
 * Stackra file contract:
 * Purpose: `BackupLock`, the vault lock of the backup account's vault: the shortest and longest retention a recovery
 *          point may have, and, only in compliance mode, the cooling-off days after which the lock is permanent.
 * Boundary: type only; computed by `backupLockFrom` from `providers.aws.backupLock` and the environments' backups,
 *           applied by `backupAccount`.
 * Runtime: isomorphic
 * Governing contract: ADR 0186 (consequence: a backup outlives its production account), ADR 0188 (decision 3).
 */

/** The backup vault's lock. */
export type BackupLock = {
  /** Days a recovery point must be kept at least. */
  readonly minRetentionDays: number;
  /** Days a recovery point may be kept at most. */
  readonly maxRetentionDays: number;
  /**
   * Days before a compliance-mode lock becomes immutable, or `null` for governance mode (removable by a principal
   * allowed `backup:DeleteBackupVaultLockConfiguration`).
   */
  readonly changeableForDays: number | null;
};
