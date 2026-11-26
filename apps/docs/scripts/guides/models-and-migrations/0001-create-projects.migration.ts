/**
 * Stackra file contract:
 * Purpose: the first migration of the "Models and migrations" guide's `projects` module: the `projects` table of
 *          `Project`, with its public id, timestamps, soft delete and the index its list reads use.
 * Boundary: a frozen snapshot that uses only `@stackra/database`; every name is a literal, as an app's
 *           `src/modules/projects/database/migrations/0001-create-projects.migration.ts` would hold it.
 * Runtime: node
 * Governing contract: ADR 0159 (migrations, as amended); ADR 0294 (decision 20: a Postgres schema per module);
 *                     STA-2843.
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the projects table. */
export class CreateProjectsMigration extends Migration {
  /** The table, its columns and its one index. */
  up(schema: SchemaBuilder): void {
    schema.create("projects", (t: Blueprint) => {
      t.hasPublicId("prj");
      t.timestamps();
      t.softDeletes();
      t.string("name", 120).notNull().comment("What the team calls the project.");
      t.string("status", 20).notNull().default("active").comment("active or closed.");
      t.timestamp("due_on").nullable().comment("When the project is due, if anyone said.");
      t.index(["status", "created_at"]);
    });
  }
}
