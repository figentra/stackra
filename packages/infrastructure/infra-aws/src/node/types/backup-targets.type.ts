/**
 * Stackra file contract:
 * Purpose: `BackupTargets`, the fixed names and ARNs in the backup account that every environment stack copies into:
 *          the vault, the replica bucket and the key alias.
 * Boundary: internal; computed by `backupTargets`, created by `backupAccount`, referenced by `awsBaseline`.
 * Runtime: node
 * Governing contract: ADR 0186 (decisions 2 and 3 as amended 2026-10-24: same region, another account).
 */

/** The backup account's fixed targets. */
export type BackupTargets = {
  /** The backup vault's name. */
  readonly vaultName: string;
  /** The backup vault's ARN. */
  readonly vaultArn: string;
  /** The replica bucket's name. */
  readonly bucketName: string;
  /** The replica bucket's ARN. */
  readonly bucketArn: string;
  /** The key alias (`alias/<project>-backup`). */
  readonly keyAlias: string;
  /** The key alias's ARN, which S3 replication accepts as the replica key. */
  readonly keyAliasArn: string;
};
