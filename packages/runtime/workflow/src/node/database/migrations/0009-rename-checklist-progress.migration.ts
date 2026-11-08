/**
 * Stackra file contract:
 * Purpose: the ninth migration of the workflow package (`workflow.0009_rename_checklist_progress`): names the progress
 *          table as its model does, `workflow.checklist_progresses`.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. Migration 0006 created the table as `checklist_progress`, but gen derives the table from the
 *           model (`ChecklistProgress`, snake_case and plural), so every ORM read and write named a table that did not
 *           exist. The rename keeps rows, indexes and the scope policy (a rename moves them with the table). No
 *           `down()`: the raw rename states its own inverse.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended: snapshots); ADR 0160 (raw SQL with a reason); ADR 0294 (decision 20:
 *                     tables are snake_case and plural); ADR 0424 (decision 2).
 */
import { Migration, type SchemaBuilder } from "@stackra/database";

/** Renames the checklist progress table to its model's name. */
export class RenameChecklistProgressMigration extends Migration {
  /** Renames the table in one step, keeping its rows, indexes and policy. */
  up(schema: SchemaBuilder): void {
    // raw-sql: the blueprint has no table rename; the statement states its inverse
    // The lint lines (STA-2612) never change the checksum: the runner hashes the SQL without them.
    schema.sql(
      "-- lint: the model and every query moved to the new name in the same release; no client reads the old one.\n" +
        "-- squawk-ignore renaming-table\n" +
        'alter table "workflow"."checklist_progress" rename to "checklist_progresses"',
      {
        inverse: 'alter table "workflow"."checklist_progresses" rename to "checklist_progress"',
      },
    );
  }
}
