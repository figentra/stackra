/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/data-maintenance, the system-held permissions of its jobs
 *          (`PartitionPermissions`, `RecordPermissions`, `IndexPermissions`, `QueryPermissions`,
 *          `ChangeLogPermissions`, `OutboxMessagePermissions`), until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Nothing here touches a database; the jobs are `./node`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note; the STA-347 stand-in barrel decision; ADR
 *                     0462 (decision 1).
 */
export { ChangeLogPermissions } from "#core/access/change-log.permissions";
export { IndexPermissions } from "#core/access/index.permissions";
export { OutboxMessagePermissions } from "#core/access/outbox-message.permissions";
export { PartitionPermissions } from "#core/access/partition.permissions";
export { QueryPermissions } from "#core/access/query.permissions";
export { RecordPermissions } from "#core/access/record.permissions";
