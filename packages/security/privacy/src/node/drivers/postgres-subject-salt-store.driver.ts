/**
 * Stackra file contract:
 * Purpose: `PostgresSubjectSaltStoreDriver`, the `postgres` driver of `SubjectSaltStore`: each subject's salt is one
 *          row of `privacy.subject_salts`, created on the subject's first seal and deleted on erasure.
 * Boundary: implements the port only. It runs in the caller's transaction (the flush that seals, the erasure step that
 *           destroys), so a salt created for a row that rolls back goes with it and the table's policy sees the
 *           session's tenant (`-` outside one). `obtain` is an insert that does nothing on a conflict followed by a
 *           read, so two racing first seals agree on one salt. Every statement names the session's partition as well,
 *           so a role that bypasses row-level security still reads and destroys only its own tenant's salt. Raw SQL with every value bound (ADR 0160). The salt is
 *           never logged.
 * Runtime: node
 * Governing contract: ADR 0188 (decision 2); ADR 0212 (crypto-shredding); ADR 0239; ADR 0160; gap gov2 (stackra-263).
 */
import { Driver } from "@stackra/container";
import type { Database } from "@stackra/database";

import { SubjectSaltStore } from "#contracts/ports/subject-salt-store.port";

/** The table. */
const SALTS = '"privacy"."subject_salts"';

/** The session's partition, as the table's policy reads it. */
const PARTITION = "coalesce(nullif(current_setting('app.tenant_id', true), ''), '-')";

/** The length of a new salt, in bytes. */
const SALT_BYTES = 32;

/** The raw-SQL surface of the entity manager this driver uses. */
interface Sql {
  execute: (statement: string, params: readonly unknown[]) => Promise<unknown>;
}

/** A selected salt row. */
type SaltRow = { readonly salt: string };

/**
 * Keeps subject salts in Postgres, per tenant.
 *
 * @example
 * // generated wiring: { port: SubjectSaltStore, candidates: { postgres: … }, deps: { postgres: [Database] } }
 */
export class PostgresSubjectSaltStoreDriver extends Driver(SubjectSaltStore) {
  /** The connected database; its entity manager is the running transaction's. */
  private readonly database: Database;

  /**
   * @param database - the connected database.
   */
  constructor(database: Database) {
    super();
    this.database = database;
  }

  /** Implements `SubjectSaltStore.find`, documented there. */
  async find(subject: string): Promise<Uint8Array | undefined> {
    const [row] = (await this.sql().execute(
      // raw-sql: the subject's salt in the session's partition, named as well as enforced by the policy
      `select salt from ${SALTS} where scope_id = ${PARTITION} and subject = ?`,
      [subject],
    )) as readonly SaltRow[];
    return row === undefined ? undefined : new Uint8Array(Buffer.from(row.salt, "base64"));
  }

  /** Implements `SubjectSaltStore.obtain`, documented there. */
  async obtain(subject: string): Promise<Uint8Array> {
    const salt = globalThis.crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    await this.sql().execute(
      // raw-sql: a racing first seal keeps the row already there
      `insert into ${SALTS} (scope_id, subject, salt, created_at) values (${PARTITION}, ?, ?, now()) ` +
        "on conflict (scope_id, subject) do nothing",
      [subject, Buffer.from(salt).toString("base64")],
    );
    const held = await this.find(subject);
    if (held === undefined) throw new Error(`The salt of ${subject} was not stored`);
    return held;
  }

  /** Implements `SubjectSaltStore.destroy`, documented there. */
  async destroy(subject: string): Promise<boolean> {
    const rows = (await this.sql().execute(
      // raw-sql: erasure deletes the salt row of the session's partition
      `delete from ${SALTS} where scope_id = ${PARTITION} and subject = ? returning subject`,
      [subject],
    )) as readonly unknown[];
    return rows.length > 0;
  }

  /** The running transaction's entity manager, as raw SQL. */
  private sql(): Sql {
    return this.database.em() as unknown as Sql;
  }
}
