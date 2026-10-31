/**
 * Stackra file contract:
 * Purpose: the `ListenerAuditTrail` port: where the bus writes one entry per listener delivery that ended, with the
 *          fields the listener added through `ctx.audit(...)`, as the action pipeline's audit step does for every
 *          action call.
 * Boundary: an abstract class that is its own token. `@stackra/actions` ships the `outbox` driver, which writes the
 *           entry as the same `audit_entry.recorded` event an action call's entry is. A service that binds none keeps
 *           no listener audit, so the step is skipped. The bus writes the entry inside the delivery's transaction (the
 *           inbox's), so it commits with what the listener wrote.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 5); ADR 0078; STA-1715.
 */
import { Port } from "@stackra/contracts";

import type { ListenerAuditEntry } from "#contracts/types/listener-audit-entry.type";

/**
 * Stores listener audit entries.
 *
 * @example
 * export class OutboxListenerAuditTrailDriver extends Driver(ListenerAuditTrail) {
 *   async record(entry: ListenerAuditEntry): Promise<void> {
 *     await this.outbox.write([toAuditEvent(entry)]);
 *   }
 * }
 */
export abstract class ListenerAuditTrail extends Port {
  /** Stores `entry`; resolves once it is written. */
  abstract record(entry: ListenerAuditEntry): Promise<void>;
}
