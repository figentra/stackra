/**
 * Stackra file contract:
 * Purpose: the `AuditTrail` port: where the pipeline's audit step writes one entry per action call, with the fields
 *          the handler added through `ctx.audit(...)`.
 * Boundary: an abstract class that is its own token, implemented by the package that stores audit records. An app that
 *           binds none keeps no audit trail, so the step is skipped. Queries are never audited here.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 5: the pipeline's audit step audits every action).
 */
import { Port } from "@stackra/contracts";

import type { AuditEntry } from "#contracts/types/audit-entry.type";

/**
 * Stores audit entries.
 *
 * @example
 * export class PostgresAuditTrailDriver extends Driver(AuditTrail) {
 *   async record(entry: AuditEntry): Promise<void> {
 *     await this.rows.insert(toRow(entry));
 *   }
 * }
 */
export abstract class AuditTrail extends Port {
  /** Stores `entry`; resolves once it is written. */
  abstract record(entry: AuditEntry): Promise<void>;
}
