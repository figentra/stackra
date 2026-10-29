/**
 * Stackra file contract:
 * Purpose: `BACKUP_ALERT_EVENTS`, the AWS Backup vault events that reach the backup alert topic: a backup, copy or
 *          restore job that failed, a backup job that expired before it could start, and continuous backup (the
 *          point-in-time recovery) that was interrupted.
 * Boundary: internal; failures only, so the topic never carries a success and its subscriber needs no filter policy.
 *           `BACKUP_JOB_COMPLETED` is left out on purpose: it fires for failed jobs too, and would need a `State`
 *           filter on every subscription.
 * Runtime: node
 * Governing contract: ADR 0186 (decisions 2, 4 and 5: a missed backup breaks the recovery point objective).
 */

/** The vault events that are alerts. */
export const BACKUP_ALERT_EVENTS = [
  "BACKUP_JOB_FAILED",
  "BACKUP_JOB_EXPIRED",
  "CONTINUOUS_BACKUP_INTERRUPTED",
  "COPY_JOB_FAILED",
  "RESTORE_JOB_FAILED",
];
