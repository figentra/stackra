/**
 * Stackra file contract:
 * Purpose: the second migration of the workflow package: `workflow.runs` gains `version`, the workflow (or document)
 *          version a run is pinned to.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. Existing runs read as version 1, the only version there was. No `down()`: gen derives the dev
 *           inverse.
 * Runtime: node
 * Governing contract: ADR 0152 (decision 2: a run is pinned to the version it started on); ADR 0159 (as amended);
 *                     R-16 (every column has a comment and its nullability).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Adds the run version. */
export class AddRunVersionMigration extends Migration {
  /** One column with its default. */
  up(schema: SchemaBuilder): void {
    schema.table("runs", (t: Blueprint) => {
      t.integer("version")
        .notNull()
        .default(1)
        .comment("The workflow or document version the run is pinned to and resumes on.");
    });
  }
}
