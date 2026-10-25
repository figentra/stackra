/**
 * Stackra file contract:
 * Purpose: `PostgresAccessLogSinkDriver`, the `postgres` sink and the package default: each record becomes the next
 *          `AccessLogEntry` of its tenant's hash chain.
 * Boundary: implements the port only. It writes in a transaction of its own (`requiresNew`), so a rolled-back read
 *           still leaves its record, and runs it inside `withTenant(record.actor, ...)`, because the new transaction
 *           does not carry the caller's tenant setting: the policy then shows only that tenant's chain, and the trait
 *           fills the row's tenant. The chain head is the tenant's highest sequence; two writers that read the same
 *           head collide on the unique (tenant, sequence) index, and the loser reads the new head and tries again, up
 *           to five times, then refuses with `AccessLogWriteFailedError`. A record of a call in no tenant cannot be
 *           stored (the tenant column is NOT NULL) and is reported by `AccessLogService`. The generated wiring loads
 *           this driver lazily, so it never reaches a browser bundle.
 * Runtime: node
 * Governing contract: ADR 0212 (decisions 3 and 5); ADR 0239 (equality on `tenant_id`); ADR 0294 (decisions 15 and
 *                     16); ADR 0263.
 */
import { Driver } from "@stackra/container";
import { UniqueViolation } from "@stackra/database";
import type { Database, Repository } from "@stackra/database";
import type { TenantIsolationService } from "@stackra/tenancy/node";

import { AccessLogSink } from "#contracts/ports/access-log-sink.port";
import type { AccessRecord } from "#contracts/types/access-record.type";
import { AccessLogWriteFailedError } from "#core/errors/access-log-write-failed.error";
import { linkAccessRecord } from "#core/functions/link-access-record.function";
import type { AccessLogEntry } from "#node/models/access-log-entry.model";

/** How many times a write reads the head and inserts before it gives up. */
const ATTEMPTS = 5;

/**
 * Stores each record as the next link of its tenant's chain.
 *
 * @example
 * export class AccessLogConfig extends BaseAccessLogConfig {
 *   override sink: DriverName<AccessLogSink> = "postgres";
 * }
 */
export class PostgresAccessLogSinkDriver extends Driver(AccessLogSink) {
  /** The access record table. */
  private readonly entries: Repository<AccessLogEntry>;

  /** The service's database, for the write's own transaction. */
  private readonly database: Database;

  /** Sets the record's tenant on that transaction. */
  private readonly tenancy: TenantIsolationService;

  /**
   * @param entries - the access record table, tenant-scoped by its policy.
   * @param database - the service's database.
   * @param tenancy - tenant isolation, for the tenant setting of the write's own transaction.
   */
  constructor(
    entries: Repository<AccessLogEntry>,
    database: Database,
    tenancy: TenantIsolationService,
  ) {
    super();
    this.entries = entries;
    this.database = database;
    this.tenancy = tenancy;
  }

  /**
   * Appends `record` to its tenant's chain in a transaction of its own.
   *
   * @throws AccessLogWriteFailedError when the head kept moving under concurrent writers.
   */
  write(record: AccessRecord): Promise<void> {
    return this.database.transaction(
      () => this.tenancy.withTenant(record.actor, () => this.append(record, 1)),
      { requiresNew: true },
    );
  }

  /** Links `record` after the current head and inserts it; on a lost race, reads the new head and retries. */
  private async append(record: AccessRecord, attempt: number): Promise<void> {
    const head = await this.entries.findOne({}, { orderBy: { sequence: "desc" } });
    const link = await linkAccessRecord(record, head ?? undefined);
    try {
      await this.entries.insert({ ...link, subjects: [...link.subjects] });
    } catch (error) {
      if (!(error instanceof UniqueViolation)) throw error;
      if (attempt >= ATTEMPTS) throw AccessLogWriteFailedError.create({}, { cause: error });
      await this.append(record, attempt + 1);
    }
  }
}
