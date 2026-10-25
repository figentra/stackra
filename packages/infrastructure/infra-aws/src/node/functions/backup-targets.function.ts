/**
 * Stackra file contract:
 * Purpose: `backupTargets(project, region, account)`, the fixed vault, replica bucket and key alias of the backup
 *          account, so an environment stack copies into them by name before (or without) reading the backup stack.
 * Boundary: internal; names only. The bucket name carries the account id, which keeps it globally unique.
 * Runtime: node
 * Governing contract: ADR 0186 (decisions 2 and 3 as amended 2026-10-24).
 */
import type { BackupTargets } from "#node/types/backup-targets.type";

/**
 * The targets in backup account `account`.
 *
 * @throws TypeError when the bucket name would exceed S3's 63 characters.
 */
export function backupTargets(project: string, region: string, account: string): BackupTargets {
  const name = `${project}-backup`;
  const bucketName = `${name}-${account}`;
  if (bucketName.length > 63)
    throw new TypeError(
      `${bucketName} is longer than a bucket name may be (63): shorten the project`,
    );
  return {
    vaultName: name,
    vaultArn: `arn:aws:backup:${region}:${account}:backup-vault:${name}`,
    bucketName,
    bucketArn: `arn:aws:s3:::${bucketName}`,
    keyAlias: `alias/${name}`,
    keyAliasArn: `arn:aws:kms:${region}:${account}:alias/${name}`,
  };
}
