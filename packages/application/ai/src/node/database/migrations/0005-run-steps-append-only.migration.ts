/**
 * Stackra file contract:
 * Purpose: the fifth migration of the ai package (`ai.0005_run_steps_append_only`): names the step and approval tables
 *          as their models do (`ai.run_steps`, `ai.run_approvals`) and revokes `UPDATE` on `ai.run_steps`, the table of
 *          the `AppendOnly` model `RunStep`, through `t.appendOnly()`.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. Migration 0001 created these tables as `steps` and `approvals`, but gen derives the table from the
 *           model key (`ai.run_step`, `ai.run_approval`), so the stores read `run_steps` and `run_approvals`; 0003 revoked
 *           on `steps`, a table the models never name. The renames keep rows, indexes and policies (a rename moves them
 *           with the table). Runs and approvals change state, so `run_approvals` keeps `UPDATE`. No `down()`: gen derives
 *           the dev inverse (grant `UPDATE` back); the raw renames state their own inverse.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended: snapshots); ADR 0160 (raw SQL with a reason); ADR 0100 (the ai tables);
 *                     STA-1413 (`t.appendOnly()`, gen's `append_only_not_revoked`); STA-1689; STA-1631.
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Renames the step and approval tables to their models' names and revokes `UPDATE` on the steps. */
export class RunStepsAppendOnlyMigration extends Migration {
  /** Two renames, then the revoke. */
  up(schema: SchemaBuilder): void {
    // raw-sql: the blueprint has no table rename; each statement states its inverse
    schema.sql('alter table "ai"."steps" rename to "run_steps"', {
      inverse: 'alter table "ai"."run_steps" rename to "steps"',
    });
    // raw-sql: same reason as above
    schema.sql('alter table "ai"."approvals" rename to "run_approvals"', {
      inverse: 'alter table "ai"."run_approvals" rename to "approvals"',
    });
    schema.table("run_steps", (t: Blueprint) => {
      t.appendOnly();
    });
  }
}
