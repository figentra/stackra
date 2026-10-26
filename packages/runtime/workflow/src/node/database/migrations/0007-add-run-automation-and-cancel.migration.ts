/**
 * Stackra file contract:
 * Purpose: the seventh migration of the workflow package: the automation each document run runs, indexed so the
 *          journal lists an automation's runs newest first, and the `cancelled` run status.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. Existing runs keep a null automation. The status check is replaced by raw SQL because a column's
 *           enum check has no blueprint change; its inverse restores the six statuses of migration 0001 (it fails
 *           while a cancelled run exists, which is the point).
 * Runtime: node
 * Governing contract: ADR 0152 (decision 4: inspect and cancel); ADR 0159 (as amended); ADR 0160 (raw SQL with a
 *                     reason); R-16 (every column has a comment and its nullability).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Adds the run's automation and the cancelled status. */
export class AddRunAutomationAndCancelMigration extends Migration {
  /** One nullable column with its index, and the widened status check. */
  up(schema: SchemaBuilder): void {
    schema.table("runs", (t: Blueprint) => {
      t.string("automation_id", 30)
        .nullable()
        .comment("The public id of the automation a document run runs; null for other runs.");
      t.index(["automation_id", "started_at"]).where("automation_id is not null");
    });
    // raw-sql: a column's enum check has no blueprint change; the constraint name is migration 0001's
    schema.sql(
      'alter table "workflow"."runs" drop constraint "ck_runs_status", add constraint "ck_runs_status" check ' +
        "(\"status\" in ('running', 'waiting', 'completed', 'compensating', 'compensated', 'failed', 'cancelled'))",
      {
        inverse:
          'alter table "workflow"."runs" drop constraint "ck_runs_status", add constraint "ck_runs_status" check ' +
          "(\"status\" in ('running', 'waiting', 'completed', 'compensating', 'compensated', 'failed'))",
      },
    );
  }
}
