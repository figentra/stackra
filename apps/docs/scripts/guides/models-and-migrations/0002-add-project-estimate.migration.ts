/**
 * Stackra file contract:
 * Purpose: the second migration of the "Models and migrations" guide's `projects` module: it adds the nullable
 *          `estimate_days` column, the expand step a released table takes instead of an edit of its first migration.
 * Boundary: a frozen snapshot that uses only `@stackra/database`; every name is a literal.
 * Runtime: node
 * Governing contract: ADR 0159 (an applied migration is frozen; expand-only column adds); STA-2843.
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Adds the estimate column. */
export class AddProjectEstimateMigration extends Migration {
  /** A nullable column needs no default, so the add takes no table rewrite. */
  up(schema: SchemaBuilder): void {
    schema.table("projects", (t: Blueprint) => {
      t.integer("estimate_days").nullable().comment("The team's estimate in days.");
    });
  }
}
