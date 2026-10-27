/**
 * Stackra file contract:
 * Purpose: `PostgresPolicySnapshotStoreDriver`, the durable, tenant-scoped `PolicySnapshotStore` (driver name
 *          `postgres`): each principal's snapshot is one row of `iam.policy_snapshots` per tenant, replaced only by a
 *          higher version.
 * Boundary: implements the port only. Each call runs in a transaction of its own (`requiresNew`) that first sets
 *           `app.tenant_id` to the call's tenant (`-` for a platform principal), so the table's forced equality policy
 *           shows and accepts only that tenant's rows whatever the caller's transaction holds. A write is one upsert
 *           that changes the row only for a higher version, so a late or repeated event never rolls a policy back. A
 *           read decodes the stored JSON with `decodePolicySnapshot`, so a corrupt row throws and the call fails
 *           closed. Raw SQL with every value bound (ADR 0160).
 * Runtime: node
 * Governing contract: ADR 0208 (decisions 1 to 4); ADR 0239; ADR 0160; ADR 0263; ADR 0407; STA-815.
 */
import { Driver } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";
import type { Database } from "@stackra/database";

import { decodePolicySnapshot } from "#core/index";
import { PolicySnapshotStore } from "#contracts/index";
import type { PolicySnapshot } from "#contracts/index";

/** The table. */
const SNAPSHOTS = '"iam"."policy_snapshots"';

/** The partition of a principal with no tenant. */
const PLATFORM = "-";

/** The raw-SQL surface of the entity manager this driver uses. */
interface Sql {
  execute(statement: string, params: readonly unknown[]): Promise<unknown>;
}

/**
 * Keeps policy snapshots in Postgres, per tenant.
 *
 * @example
 * // runway.yaml: the IAM consumer binds { port: PolicySnapshotStore, driver: postgres }
 * await store.write(event.principal, decodePolicySnapshot(event.snapshot), meta.scopeId);
 */
export class PostgresPolicySnapshotStoreDriver extends Driver(PolicySnapshotStore) {
  /** The connected database each call opens its own transaction on. */
  private readonly database: Database;

  /**
   * @param database - the connected database.
   */
  constructor(database: Database) {
    super();
    this.database = database;
  }

  /**
   * See `PolicySnapshotStore.read`.
   *
   * @throws TypeError when the stored row is not a policy snapshot.
   */
  async read(principal: PublicId, scopeId?: PublicId): Promise<PolicySnapshot | undefined> {
    const rows = (await this.run(scopeId, (sql) =>
      // raw-sql: the one row of this principal in the tenant the session is set to
      sql.execute(`select snapshot from ${SNAPSHOTS} where tenant_id = ? and principal = ?`, [
        scopeId ?? PLATFORM,
        principal,
      ]),
    )) as readonly { readonly snapshot: unknown }[];
    const [row] = rows;
    if (row === undefined) return undefined;
    return decodePolicySnapshot(
      typeof row.snapshot === "string" ? JSON.parse(row.snapshot) : row.snapshot,
    );
  }

  /** See `PolicySnapshotStore.write`. */
  async write(principal: PublicId, snapshot: PolicySnapshot, scopeId?: PublicId): Promise<boolean> {
    const kept = (await this.run(scopeId, (sql) =>
      // raw-sql: one upsert that replaces the row only with a higher version
      sql.execute(
        `insert into ${SNAPSHOTS} (tenant_id, principal, version, snapshot, created_at, updated_at) ` +
          "values (?, ?, ?, ?::jsonb, now(), now()) on conflict (tenant_id, principal) do update set " +
          "version = excluded.version, snapshot = excluded.snapshot, updated_at = now() " +
          `where ${SNAPSHOTS}.version < excluded.version returning principal`,
        [scopeId ?? PLATFORM, principal, snapshot.version, JSON.stringify(snapshot)],
      ),
    )) as readonly unknown[];
    return kept.length > 0;
  }

  /** Runs `work` in a transaction of its own whose `app.tenant_id` is `scopeId` (or the platform partition). */
  private run<T>(scopeId: PublicId | undefined, work: (sql: Sql) => Promise<T>): Promise<T> {
    return this.database.transaction(
      async () => {
        const sql = this.database.em() as unknown as Sql;
        // raw-sql: the tenant the table's equality policy reads, for this transaction only
        await sql.execute("select set_config('app.tenant_id', ?, true)", [scopeId ?? PLATFORM]);
        return work(sql);
      },
      { requiresNew: true },
    );
  }
}
