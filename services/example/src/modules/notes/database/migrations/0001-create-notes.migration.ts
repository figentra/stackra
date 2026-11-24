/**
 * Stackra file contract:
 * Purpose: the first migration of the notes module: the `notes` table of `Note`, in the module's `notes` schema, with its
 *          tenant column and forced row-level policy.
 * Boundary: a frozen snapshot that uses only `@stackra/database`; every name is a literal. `belongsToTenant()` adds
 *           `tenant_id`, enables and forces row-level security and writes the equality policy on
 *           `current_setting('app.tenant_id', true)`; nothing here writes a policy by hand.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended); ADR 0239 (equality on `tenant_id`); ADR 0294 (as amended by programming
 *                     model v3.1, AGENTS.md).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the notes table. */
export class CreateNotesMigration extends Migration {
  /** Creates the table with its public id, tenant, timestamps, title and text. */
  up(schema: SchemaBuilder): void {
    schema.create("notes", (t: Blueprint) => {
      t.hasPublicId("not");
      t.belongsToTenant();
      t.timestamps();
      t.string("title", 120).notNull().comment("The note's title.");
      t.string("body", 2000).notNull().comment("The note's text; empty for a title-only note.");
      t.index(["tenant_id", "created_at"]);
    });
  }
}
