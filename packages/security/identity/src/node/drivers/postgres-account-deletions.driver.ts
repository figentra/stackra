/**
 * Stackra file contract:
 * Purpose: `PostgresAccountDeletionsDriver`, the `postgres` driver of `AccountDeletions`: each scheduled account
 *          deletion is one row of `identity.account_deletions` (migration `identity.0001`).
 * Boundary: implements the port only. It runs in the caller's transaction, so a deletion and the event the action
 *           records commit together, and the table's forced policy sees the session's tenant (null outside one). Every
 *           statement names the partition as well, so a role that bypasses row-level security still reads and writes
 *           only its own tenant's rows; there is no cross-tenant read (tenancy rule 5): the erase job runs per scope.
 *           `put` is an upsert on the one-per-subject index. Raw SQL with every value bound (ADR 0160).
 * Runtime: node
 * Governing contract: App Store Review Guideline 5.1.1(v); ADR 0263 (ports and drivers); ADR 0239; ADR 0160;
 *                     `.agents/rules/tenancy.md`; STA-1567.
 */
import { Driver } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";
import type { Database } from "@stackra/database";

import { AccountDeletions } from "#contracts/index";
import type { AccountDeletion } from "#contracts/index";

/** The table. */
const DELETIONS = '"identity"."account_deletions"';

/** The session's partition, as the table's policy reads it: its tenant, or null outside one. */
const SCOPE = "nullif(current_setting('app.tenant_id', true), '')";

/** The columns read back. */
const COLUMNS = "erasure_id, subject, requested_at, due_at";

/** The raw-SQL surface of the entity manager this driver uses. */
interface Sql {
  execute: (statement: string, params: readonly unknown[]) => Promise<unknown>;
}

/** A selected row. */
type DeletionRow = {
  readonly erasure_id: string;
  readonly subject: string;
  readonly requested_at: Date | string;
  readonly due_at: Date | string;
};

/** A row as the port's record. */
const deletionOf = (row: DeletionRow): AccountDeletion => ({
  subject: row.subject as PublicId<"usr">,
  erasureId: row.erasure_id,
  requestedAt: new Date(row.requested_at),
  dueAt: new Date(row.due_at),
});

/**
 * Keeps scheduled account deletions in Postgres, per tenant.
 *
 * @example
 * // generated wiring: { port: AccountDeletions, candidates: { postgres: … }, deps: { postgres: [Database] } }
 */
export class PostgresAccountDeletionsDriver extends Driver(AccountDeletions) {
  /** The connected database; its entity manager is the running transaction's. */
  private readonly database: Database;

  /**
   * @param database - the connected database.
   */
  constructor(database: Database) {
    super();
    this.database = database;
  }

  /** Implements `AccountDeletions.put`, documented there. */
  async put(deletion: AccountDeletion): Promise<void> {
    await this.sql().execute(
      // raw-sql: one deletion per subject in the session's partition, replaced in place
      `insert into ${DELETIONS} (erasure_id, scope_id, subject, requested_at, due_at) values (?, ${SCOPE}, ?, ?, ?) ` +
        "on conflict ((coalesce(scope_id, '-')), subject) do update set erasure_id = excluded.erasure_id, " +
        "requested_at = excluded.requested_at, due_at = excluded.due_at",
      [deletion.erasureId, deletion.subject, deletion.requestedAt, deletion.dueAt],
    );
  }

  /** Implements `AccountDeletions.find`, documented there. */
  async find(subject: PublicId<"usr">): Promise<AccountDeletion | undefined> {
    const [row] = (await this.sql().execute(
      // raw-sql: the subject's deletion in the session's partition, named as well as enforced by the policy
      `select ${COLUMNS} from ${DELETIONS} where scope_id is not distinct from ${SCOPE} and subject = ?`,
      [subject],
    )) as readonly DeletionRow[];
    return row === undefined ? undefined : deletionOf(row);
  }

  /** Implements `AccountDeletions.remove`, documented there. */
  async remove(subject: PublicId<"usr">): Promise<boolean> {
    const rows = (await this.sql().execute(
      // raw-sql: a cancel or a started erasure removes the session partition's row
      `delete from ${DELETIONS} where scope_id is not distinct from ${SCOPE} and subject = ? returning subject`,
      [subject],
    )) as readonly unknown[];
    return rows.length > 0;
  }

  /** Implements `AccountDeletions.due`, documented there. */
  async due(now: Date, limit: number): Promise<readonly AccountDeletion[]> {
    const rows = (await this.sql().execute(
      // raw-sql: the due deletions of the session's partition, oldest due first
      `select ${COLUMNS} from ${DELETIONS} where scope_id is not distinct from ${SCOPE} and due_at <= ? ` +
        "order by due_at limit ?",
      [now, limit],
    )) as readonly DeletionRow[];
    return rows.map(deletionOf);
  }

  /** The running transaction's entity manager, as raw SQL. */
  private sql(): Sql {
    return this.database.em() as unknown as Sql;
  }
}
