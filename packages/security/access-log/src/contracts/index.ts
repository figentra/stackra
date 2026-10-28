/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/access-log (the `AccessLogSink` port, the types it
 *          exchanges and the audit record and link types) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package (ADR
 *           0294 decision 15). `DataClassification` is @stackra/contracts', so it is imported from there and never
 *           re-exported here.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { AccessLogSink } from "#contracts/ports/access-log-sink.port";
export type { AccessLink } from "#contracts/types/access-link.type";
export type { AccessLoggedOptions } from "#contracts/types/access-logged-options.type";
export type { AccessRecord } from "#contracts/types/access-record.type";
export type { AuditLink } from "#contracts/types/audit-link.type";
export type { AuditRecord } from "#contracts/types/audit-record.type";
