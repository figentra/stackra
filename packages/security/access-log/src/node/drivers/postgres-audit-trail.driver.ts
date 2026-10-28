/**
 * Stackra file contract:
 * Purpose: `PostgresAuditTrailDriver`, the `postgres` driver of the `AuditTrail` port of @stackra/actions: each audited
 *          action call becomes the next `AuditLogEntry` of its tenant's audit hash chain, for a host that runs no
 *          separate audit service (the `outbox` driver stays the choice of one that does, such as Figentra OS).
 * Boundary: implements the port only. It writes inside `withTenant(call.actor, ...)`, which is a savepoint inside the
 *           caller's transaction, so the success entry the pipeline writes inside the unit of work commits or rolls
 *           back with the call's writes, and a refusal's entry (written after the rollback) gets a transaction of its
 *           own. The chain head is the tenant's highest sequence; two writers that read the same head collide on the
 *           unique (tenant, sequence) index, and the loser retries from a fresh savepoint with the new head, up to five
 *           times, then lets the violation through. A call in no tenant cannot be stored (the tenant column is NOT
 *           NULL): it is logged as `audit_write_skipped` and the call goes on. The generated wiring loads this driver
 *           lazily, so it never reaches a browser bundle.
 * Runtime: node
 * Governing contract: ADR 0136 (decision 5); ADR 0212 (decisions 3 and 4); ADR 0465 (decision 4); ADR 0239 (equality
 *                     on `tenant_id`); ADR 0294 (decisions 15 and 16); ADR 0263.
 */
import { AuditTrail, type AuditEntry } from "@stackra/actions/contracts";
import { Driver } from "@stackra/container";
import type { Logger } from "@stackra/contracts";
import { UniqueViolation } from "@stackra/database";
import type { Repository } from "@stackra/database";
import type { TenantIsolationService } from "@stackra/tenancy/node";

import { AUDIT_WRITE_SKIPPED } from "#core/constants/audit-write-skipped.constant";
import { linkAuditEntry } from "#core/functions/link-audit-entry.function";
import type { AuditLogEntry } from "#node/models/audit-log-entry.model";

/** How many times a write reads the head and inserts before it gives up. */
const ATTEMPTS = 5;

/**
 * Stores each audit entry as the next link of its tenant's audit chain.
 *
 * @example
 * // generated wiring: { port: AuditTrail, candidates: { outbox: …, postgres: … }, deps: { postgres: [Repository<AuditLogEntry>, TenantIsolationService, Logger] } }
 */
export class PostgresAuditTrailDriver extends Driver(AuditTrail) {
  /** The write audit table. */
  private readonly entries: Repository<AuditLogEntry>;

  /** Sets the call's tenant on the write's savepoint or transaction. */
  private readonly tenancy: TenantIsolationService;

  /** Where a skipped entry is reported. */
  private readonly logger: Logger;

  /**
   * @param entries - the write audit table, tenant-scoped by its policy.
   * @param tenancy - tenant isolation, for the tenant setting of the write.
   * @param logger - where an entry of a call in no tenant is reported.
   */
  constructor(entries: Repository<AuditLogEntry>, tenancy: TenantIsolationService, logger: Logger) {
    super();
    this.entries = entries;
    this.tenancy = tenancy;
    this.logger = logger;
  }

  /**
   * Appends `entry` to its tenant's audit chain.
   *
   * @throws UniqueViolation when the head kept moving under five concurrent writers.
   */
  async record(entry: AuditEntry): Promise<void> {
    const { actor, callId, key } = entry.call;
    if (actor.scopeId === undefined) {
      this.logger.warn(AUDIT_WRITE_SKIPPED, { callId, key });
      return;
    }
    for (let attempt = 1; ; attempt++) {
      try {
        await this.tenancy.withTenant(actor, () => this.append(entry));
        return;
      } catch (error) {
        if (!(error instanceof UniqueViolation) || attempt >= ATTEMPTS) throw error;
      }
    }
  }

  /** Links `entry` after the current head and inserts it. */
  private async append(entry: AuditEntry): Promise<void> {
    const head = await this.entries.findOne({}, { orderBy: { sequence: "desc" } });
    const link = await linkAuditEntry(entry, head ?? undefined);
    await this.entries.insert({ ...link, effects: [...link.effects], fields: { ...link.fields } });
  }
}
