/**
 * Stackra file contract:
 * Purpose: `AuditQuery`, `access_log.audit_log_entry.search@1`: the tenant's write audit, newest first, filtered by
 *          call, action key, actor, outcome and time; `GET /audit-log-entries/search`.
 * Boundary: read only, one statement. The tenant is the policy's, never an input (R-59): a caller sees only its own
 *           tenant's records. The permission is `access_log.audit_log_entry.read` (L1). The cursor is the sequence of
 *           the previous page's last record, so pages stay stable while new calls are audited; each page comes with its
 *           chain fields, so a reader verifies it with `findAuditChainBreak` (a filtered page is not consecutive, so
 *           verify an unfiltered one). The actor filter matches the jsonb `actor.id`.
 * Runtime: node
 * Governing contract: ADR 0465 (decision 4); ADR 0212 (decisions 3 and 4); ADR 0294 (decisions 16 and 21); the HTTP
 *                     conventions (cursor pagination).
 */
import { Query } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import type { Repository } from "@stackra/database";
import type { Where } from "@stackra/database/contracts";

import { AuditLogEntryPermissions } from "#node/access/audit-log-entry.permissions";
import type { AuditLogEntry } from "#node/models/audit-log-entry.model";
import { AuditLogEntryView } from "#node/schemas/audit-log-entry-view.schema";
import type { AuditQueryInput } from "#node/schemas/audit-query-input.schema";
import { AuditQueryOutput } from "#node/schemas/audit-query-output.schema";

/**
 * Reads the tenant's write audit.
 *
 * @example
 * const { items, nextCursor } = await pipeline.execute(AuditQuery, { key: "orders.order.cancel@1" }, { actor });
 */
export class AuditQuery extends Query({
  key: "audit_log_entry.search",
  permission: AuditLogEntryPermissions.read,
  actors: [ActorKind.User, ActorKind.Service],
}) {
  /** The write audit table, tenant-scoped by its policy. */
  private readonly entries: Repository<AuditLogEntry>;

  /**
   * @param entries - the write audit table.
   */
  constructor(entries: Repository<AuditLogEntry>) {
    super();
    this.entries = entries;
  }

  /** One page, newest first; one row more than the limit is read to know whether another page follows. */
  async handle(input: AuditQueryInput): Promise<AuditQueryOutput> {
    const rows = await this.entries.find(this.where(input), {
      orderBy: { sequence: "desc" },
      limit: input.limit + 1,
    });
    const page = rows.slice(0, input.limit);
    const last = page.at(-1);
    const hasMore = rows.length > input.limit && last !== undefined;
    return AuditQueryOutput.create({
      items: page.map((row) =>
        AuditLogEntryView.create({
          id: row.id,
          callId: row.callId,
          key: row.key,
          permission: row.permission,
          risk: row.risk,
          effects: [...row.effects],
          actor: row.actor,
          scopeId: row.scopeId,
          scopePath: row.scopePath,
          originKind: row.originKind,
          originId: row.originId,
          outcome: row.outcome,
          code: row.code,
          fields: { ...row.fields },
          at: row.at,
          sequence: row.sequence,
          previousHash: row.previousHash,
          hash: row.hash,
        }),
      ),
      ...(hasMore ? { nextCursor: String(last.sequence) } : {}),
      hasMore,
    });
  }

  /** The filter of `input`; absent fields do not filter. */
  private where(input: AuditQueryInput): Where<AuditLogEntry> {
    const at = {
      ...(input.from === undefined ? {} : { $gte: input.from }),
      ...(input.to === undefined ? {} : { $lt: input.to }),
    };
    return {
      ...(input.callId === undefined ? {} : { callId: input.callId }),
      ...(input.key === undefined ? {} : { key: input.key }),
      ...(input.outcome === undefined ? {} : { outcome: input.outcome }),
      ...(input.actorId === undefined ? {} : { actor: { id: input.actorId } }),
      ...(Object.keys(at).length === 0 ? {} : { at }),
      ...(input.cursor === undefined ? {} : { sequence: { $lt: Number(input.cursor) } }),
      // reason: MikroORM types a jsonb column's nested filter (`actor.id`) loosely, so the object is asserted once here
    } as Where<AuditLogEntry>;
  }
}
