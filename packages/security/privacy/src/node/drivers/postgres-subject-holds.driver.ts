/**
 * Stackra file contract:
 * Purpose: `PostgresSubjectHoldsDriver`, the `postgres` driver of `SubjectHolds`: a subject is held while a live row of
 *          `privacy.legal_holds` names its public id as `record_id` (the hold `PlaceHoldAction` places on a subject,
 *          which also holds every record linked to it).
 * Boundary: implements the port only, read only. It reads the caller's own holds (its tenant's, or the platform's
 *           outside a tenant, `tenant_id` against `app.tenant_id`), never across tenants: the table's policy is forced,
 *           and tenancy rule 5 allows a cross-tenant read only in a privileged endpoint an ADR names. That is the owner
 *           `EraseSubjectWorkflow` erases in when the same job starts it, so the answer covers exactly where the
 *           erasure would act; the caller runs once per scope (`perScope`) to reach each tenant's holds. The statement
 *           names the owner as well as the policy enforcing it, so a tenant does not take the platform's holds the
 *           policy lets it read, and a role that bypasses row-level security still reads only its own owner's holds.
 *           Raw SQL with every value bound (ADR 0160).
 * Runtime: node
 * Governing contract: ADR 0134 (2026-10-24 amendment: holds); ADR 0189 (decision 4); ADR 0239 (2026-11-07 amendment, gap C); ADR 0160;
 *                     `.agents/rules/tenancy.md` (rule 5); STA-1567.
 */
import { Driver } from "@stackra/container";
import type { Database } from "@stackra/database";

import { SubjectHolds } from "#contracts/ports/subject-holds.port";

/** The holds table. */
const HOLDS = '"privacy"."legal_holds"';

/** The call's own rows: its tenant's, or the platform's outside a tenant, as the table's policy writes them. */
const OWN = "tenant_id is not distinct from nullif(current_setting('app.tenant_id', true), '')";

/** The raw-SQL surface of the entity manager this driver uses. */
interface Sql {
  execute: (statement: string, params: readonly unknown[]) => Promise<unknown>;
}

/**
 * Answers subject holds from the product's own Postgres store.
 *
 * @example
 * // generated wiring: { port: SubjectHolds, candidates: { postgres: … }, deps: { postgres: [Database] } }
 */
export class PostgresSubjectHoldsDriver extends Driver(SubjectHolds) {
  /** The connected database; its entity manager is the running transaction's. */
  private readonly database: Database;

  /**
   * @param database - the connected database.
   */
  constructor(database: Database) {
    super();
    this.database = database;
  }

  /** Implements `SubjectHolds.isHeld`, documented there. */
  async isHeld(subject: string): Promise<boolean> {
    const rows = (await this.sql().execute(
      // raw-sql: one live hold on the subject in the call's own owner, named as well as enforced by the policy
      `select 1 from ${HOLDS} where ${OWN} and released_at is null and record_id = ? limit 1`,
      [subject],
    )) as readonly unknown[];
    return rows.length > 0;
  }

  /** The running transaction's entity manager, as raw SQL. */
  private sql(): Sql {
    return this.database.em() as unknown as Sql;
  }
}
