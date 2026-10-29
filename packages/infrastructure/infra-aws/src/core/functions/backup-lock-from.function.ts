/**
 * Stackra file contract:
 * Purpose: `backupLockFrom(runway)`, the backup vault's lock from `providers.aws.backupLock`: the retention bounds
 *          default to the shortest and longest snapshot retention of the environments (35 days when none declares
 *          backups), governance mode unless the runway asks for compliance.
 * Boundary: internal; read by `accountsFrom`. A lock that would refuse an environment's copies, or allow a copy past
 *           the ADR 0188 ceiling that no environment's crypto-shredding covers, is refused here, before any stack runs.
 * Runtime: isomorphic
 * Governing contract: ADR 0186 (decision 2 and its consequence), ADR 0188 (decision 3).
 */
import { RunwayInvalidError } from "@stackra/runway";
import type { RunwayIssue } from "@stackra/runway";

import { BACKUP_DAYS_CEILING } from "#core/constants/backup-days-ceiling.constant";
import { ROOT_SOURCE } from "#core/constants/root-source.constant";
import { SNAPSHOT_DAYS } from "#core/constants/snapshot-days.constant";
import type { BackupLock } from "#core/types/backup-lock.type";
import type { InfraRunway } from "#core/types/infra-runway.type";

/** Where the lock is set. */
const PATH = "providers.aws.backupLock";

/**
 * The lock of `runway`'s backup vault.
 *
 * @throws RunwayInvalidError when the bounds would refuse an environment's snapshot copy, or `maxRetentionDays` passes
 *         35 days while no environment keeps (crypto-shredded) copies that long.
 */
export function backupLockFrom(runway: InfraRunway): BackupLock {
  const days = Object.values(runway.environments).flatMap((settings) => {
    const backups = settings.shared?.database?.backups;
    return backups === undefined ? [] : [backups.retentionDays ?? SNAPSHOT_DAYS];
  });
  const shortest = days.length === 0 ? SNAPSHOT_DAYS : Math.min(...days);
  const longest = days.length === 0 ? SNAPSHOT_DAYS : Math.max(...days);
  const lock = runway.providers.aws.backupLock;
  const minRetentionDays = lock?.minRetentionDays ?? shortest;
  const maxRetentionDays = lock?.maxRetentionDays ?? longest;

  const issues: RunwayIssue[] = [];
  if (minRetentionDays > shortest)
    issues.push({
      path: `${PATH}.minRetentionDays`,
      message: `An environment keeps snapshot copies ${shortest} days; the lock would refuse them`,
    });
  if (maxRetentionDays < longest)
    issues.push({
      path: `${PATH}.maxRetentionDays`,
      message: `An environment keeps snapshot copies ${longest} days; the lock would refuse them`,
    });
  else if (maxRetentionDays > Math.max(BACKUP_DAYS_CEILING, longest))
    issues.push({
      path: `${PATH}.maxRetentionDays`,
      message: `Keep it ${Math.max(BACKUP_DAYS_CEILING, longest)} days or less: no environment keeps crypto-shredded copies longer (ADR 0188 decision 3)`,
    });
  if (issues.length > 0) throw new RunwayInvalidError(ROOT_SOURCE, issues);
  return { minRetentionDays, maxRetentionDays, changeableForDays: lock?.changeableForDays ?? null };
}
